import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@deepgram/sdk";

// --- Deepgram Helper to Transcribe from a URL ---
async function transcribeAudioFromUrl(audioUrl: string): Promise<string> {
    if (!process.env.DEEPGRAM_API_KEY) {
        throw new Error("Deepgram API key not configured.");
    }
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        { model: "nova-2", smart_format: true }
    );

    if (error) {
        console.error("Deepgram Transcription Error:", error);
        throw new Error("Failed to transcribe audio from URL.");
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;
    if (!transcript.trim()) {
        return "[NO SPEECH DETECTED]";
    }
    return transcript;
}

// --- Gemini Analysis Helper (No changes needed) ---
async function analyzeTextWithGemini(readingResults: any[], repetitionResults: any[]) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key not configured.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    let combinedTextForAnalysis = "Analyze the following speech performance:\n\n";
    combinedTextForAnalysis += "== Reading Section ==\n";
    readingResults.forEach((item, i) => {
        combinedTextForAnalysis += `Task ${i+1} (Original): "${item.originalText}"\n`;
        combinedTextForAnalysis += `Task ${i+1} (User Spoke): "${item.transcribedText}"\n\n`;
    });
    combinedTextForAnalysis += "== Repetition Section ==\n";
    repetitionResults.forEach((item, i) => {
        combinedTextForAnalysis += `Task ${i+1} (Original): "${item.originalText}"\n`;
        combinedTextForAnalysis += `Task ${i+1} (User Spoke): "${item.transcribedText}"\n\n`;
    });
    
    const prompt = `
        You are an expert communication coach. Analyze the provided text which contains an original script and what a user spoke.
        Evaluate the user's performance based on accuracy (how closely they matched the original text).
        Provide a score out of 100 for "Reading" and a score out of 100 for "Repetition".
        Also, provide a brief, encouraging feedback report (2-3 sentences).
        IMPORTANT RULE: If the user's speech for a task is "[NO SPEECH DETECTED]", you MUST assign a score of 0 for that task.
        Return your response ONLY as a valid JSON object with the following structure:
        { "scores": { "reading": number, "repetition": number }, "reportText": "string" }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
}

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // The payload now contains URLs, not base64 strings
        const { readingResults, repetitionResults, comprehensionResults } = await req.json();

        // Transcribe all audio files from their URLs in parallel
        const readingTranscripts = await Promise.all(
            readingResults.map(async (r: any) => ({
                originalText: r.originalText,
                transcribedText: await transcribeAudioFromUrl(r.audioUrl)
            }))
        );

        const repetitionTranscripts = await Promise.all(
            repetitionResults.map(async (r: any) => ({
                originalText: r.originalText,
                transcribedText: await transcribeAudioFromUrl(r.audioUrl)
            }))
        );

        // Analyze the transcribed text
        const geminiAnalysis = await analyzeTextWithGemini(readingTranscripts, repetitionTranscripts);
        
        // Calculate scores for the current session
        const correctComprehension = comprehensionResults.filter((r: any) => r.isCorrect).length;
        const comprehensionScore = comprehensionResults.length > 0 ? (correctComprehension / comprehensionResults.length) * 100 : 0;
        const overallScore = (geminiAnalysis.scores.reading + geminiAnalysis.scores.repetition + comprehensionScore) / 3;

        const newSessionId = uuidv4();
        const newSession = {
            id: newSessionId,
            date: new Date().toISOString(),
            type: "Communication Practice",
            score: Math.round(overallScore),
            feedback: {
                scores: {
                    overall: Math.round(overallScore),
                    reading: geminiAnalysis.scores.reading,
                    repetition: geminiAnalysis.scores.repetition,
                    comprehension: Math.round(comprehensionScore),
                },
                reportText: geminiAnalysis.reportText,
            },
        };

        // Fetch the user's existing data
        const { data: currentData } = await supabase
            .from('user_dashboard_data')
            .select('*')
            .eq('user_email', user.email)
            .single();

        const oldHistory = currentData?.session_history || [];
        const newHistory = [...oldHistory, newSession];
        const sessionsCompleted = newHistory.length;

        // Recalculate averages from the full history for accuracy
        const totalReading = newHistory.reduce((sum, s) => sum + s.feedback.scores.reading, 0);
        const totalRepetition = newHistory.reduce((sum, s) => sum + s.feedback.scores.repetition, 0);
        const totalComprehension = newHistory.reduce((sum, s) => sum + s.feedback.scores.comprehension, 0);
        const totalOverall = newHistory.reduce((sum, s) => sum + s.score, 0);

        const newAvgReading = totalReading / sessionsCompleted;
        const newAvgRepetition = totalRepetition / sessionsCompleted;
        const newAvgComprehension = totalComprehension / sessionsCompleted;
        const newOverallAverage = totalOverall / sessionsCompleted;

        // Save the updated record to the database
        await supabase.from('user_dashboard_data').upsert({
            user_email: user.email,
            sessions_completed: sessionsCompleted,
            overall_average: newOverallAverage,
            avg_reading: newAvgReading,
            avg_repetition: newAvgRepetition,
            avg_comprehension: newAvgComprehension,
            session_history: newHistory,
        });

        return NextResponse.json({ sessionId: newSessionId, analysis: newSession.feedback });

    } catch (error: any) {
        console.error("Error in /api/analyze:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
