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

    try {
        const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
            { url: audioUrl },
            { model: "nova-2", smart_format: true, punctuate: true }
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
    } catch (transcriptionError) {
        console.error("Caught error during transcription:", transcriptionError);
        return "[TRANSCRIPTION FAILED]"; // Return a specific error string
    }
}

// --- Gemini Analysis Helper (Updated with a more sophisticated prompt) ---
async function analyzeTextWithGemini(readingResults: any[], repetitionResults: any[]) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key not configured.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    let combinedTextForAnalysis = "Analyze the following speech performance:\n\n";
    combinedTextForAnalysis += "== Reading Section Tasks ==\n";
    readingResults.forEach((item, i) => {
        combinedTextForAnalysis += `Task ${i+1} (Original Text): "${item.originalText}"\n`;
        combinedTextForAnalysis += `Task ${i+1} (User's Speech): "${item.transcribedText}"\n\n`;
    });
    combinedTextForAnalysis += "== Repetition Section Tasks ==\n";
    repetitionResults.forEach((item, i) => {
        combinedTextForAnalysis += `Task ${i+1} (Original Text): "${item.originalText}"\n`;
        combinedTextForAnalysis += `Task ${i+1} (User's Speech): "${item.transcribedText}"\n\n`;
    });
    
    const prompt = `
        You are an expert, encouraging communication coach named 'Sensei'. Your task is to analyze a user's speech performance from a 'Reading' and a 'Repetition' section. For each section, you are given the original text and the user's transcribed speech for several tasks.

        Your evaluation must be based on the following criteria for EACH section (Reading and Repetition):
        1.  **Accuracy Score (0-100):** Based on the percentage of correctly spoken words compared to the original text. Deduct points for missed words, extra words, or mispronounced words.
        2.  **Fluency Score (0-100):** Infer this from the transcription. A perfect, complete transcription suggests high fluency. A disjointed, hesitant, or incomplete transcription suggests lower fluency.
        3.  **Completeness Score (0-100):** Based on how much of the original text the user attempted to say. If they only said half the words, the score should be around 50.

        CRITICAL RULES:
        - If the user's speech for ALL tasks in a section is "[NO SPEECH DETECTED]" or "[TRANSCRIPTION FAILED]", all three scores (Accuracy, Fluency, Completeness) for that section MUST be 0.
        - If some tasks have speech and others do not, score the ones with speech normally and average them, but the overall section score should still be reduced.

        After scoring, generate a concise, positive, and actionable "reportText" (3-4 sentences). Start with a positive observation, then offer one specific tip for improvement. If a section's score is 0 due to no speech, the feedback should gently encourage the user to try speaking next time for that section.

        You MUST return ONLY a valid JSON object. Do not include any other text, markdown formatting, or explanations. The JSON structure must be:
        {
          "reading": { "accuracy": number, "fluency": number, "completeness": number },
          "repetition": { "accuracy": number, "fluency": number, "completeness": number },
          "reportText": "string"
        }
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
        const { readingResults, repetitionResults, comprehensionResults } = await req.json();

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

        const geminiAnalysis = await analyzeTextWithGemini(readingTranscripts, repetitionTranscripts);
        
        // Calculate a more nuanced score for Reading and Repetition from the sub-scores
        const readingScore = (geminiAnalysis.reading.accuracy * 0.5) + (geminiAnalysis.reading.fluency * 0.3) + (geminiAnalysis.reading.completeness * 0.2);
        const repetitionScore = (geminiAnalysis.repetition.accuracy * 0.5) + (geminiAnalysis.repetition.fluency * 0.3) + (geminiAnalysis.repetition.completeness * 0.2);

        const correctComprehension = comprehensionResults.filter((r: any) => r.isCorrect).length;
        const comprehensionScore = comprehensionResults.length > 0 ? (correctComprehension / comprehensionResults.length) * 100 : 0;
        
        const overallScore = (readingScore + repetitionScore + comprehensionScore) / 3;

        const newSessionId = uuidv4();
        const newSession = {
            id: newSessionId,
            date: new Date().toISOString(),
            type: "Communication Practice",
            score: Math.round(overallScore),
            feedback: {
                scores: {
                    overall: Math.round(overallScore),
                    reading: Math.round(readingScore),
                    repetition: Math.round(repetitionScore),
                    comprehension: Math.round(comprehensionScore),
                },
                reportText: geminiAnalysis.reportText,
                // Optionally store the detailed sub-scores for more detailed feedback pages later
                detailedScores: geminiAnalysis 
            },
        };

        const { data: currentData } = await supabase
            .from('user_dashboard_data')
            .select('*')
            .eq('user_email', user.email)
            .single();

        const oldHistory = currentData?.session_history || [];
        const newHistory = [...oldHistory, newSession];
        const sessionsCompleted = newHistory.length;

        const totalReading = newHistory.reduce((sum, s) => sum + s.feedback.scores.reading, 0);
        const totalRepetition = newHistory.reduce((sum, s) => sum + s.feedback.scores.repetition, 0);
        const totalComprehension = newHistory.reduce((sum, s) => sum + s.feedback.scores.comprehension, 0);
        const totalOverall = newHistory.reduce((sum, s) => sum + s.score, 0);

        await supabase.from('user_dashboard_data').upsert({
            user_email: user.email,
            sessions_completed: sessionsCompleted,
            overall_average: totalOverall / sessionsCompleted,
            avg_reading: totalReading / sessionsCompleted,
            avg_repetition: totalRepetition / sessionsCompleted,
            avg_comprehension: totalComprehension / sessionsCompleted,
            session_history: newHistory,
        });

        // After successful analysis and DB update, delete the audio files
        const readingPaths = readingResults.map((r: any) => r.audioUrl.substring(r.audioUrl.lastIndexOf(user.id)));
        const repetitionPaths = repetitionResults.map((r: any) => r.audioUrl.substring(r.audioUrl.lastIndexOf(user.id)));
        await supabase.storage.from('audio-uploads').remove([...readingPaths, ...repetitionPaths]);

        return NextResponse.json({ sessionId: newSessionId, analysis: newSession.feedback });

    } catch (error: any) {
        console.error("Error in /api/analyze:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
