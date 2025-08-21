import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk'; // Import the Groq SDK
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
        return "[TRANSCRIPTION FAILED]";
    }
}

// --- NEW: Groq Analysis Helper ---
async function analyzePerformanceWithGroq(readingResults: any[], repetitionResults: any[]) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("Groq API key not configured.");
    }
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    let combinedTextForAnalysis = "Analyze the following speech performance from a user. The user completed a 'Reading' section and a 'Repetition' section.\n\n";
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
        You are an expert, encouraging communication coach named 'Sensei'. Your task is to analyze the user's entire speech performance provided below.

        First, for the "Reading" section and the "Repetition" section, calculate an overall score from 0-100 for each. The score should be an average based on the user's accuracy, fluency, and completeness across all tasks in that section.

        CRITICAL RULE: If the user's speech for ALL tasks in a section is "[NO SPEECH DETECTED]" or "[TRANSCRIPTION FAILED]", the score for that entire section MUST be 0.

        Second, after calculating the scores, generate a concise, positive, and actionable "reportText" (3-4 sentences). Start with a positive observation about their performance, then offer one specific tip for improvement.

        You MUST return ONLY a valid JSON object. Do not include any other text, markdown formatting, or explanations. The JSON structure must be:
        {
          "scores": {
            "reading": number,
            "repetition": number
          },
          "reportText": "string"
        }

        Here is the complete performance data to analyze:
        ${combinedTextForAnalysis}
    `;

    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama3-8b-8192", // Using a fast and capable Llama 3 model
        temperature: 0.2,
        response_format: { type: "json_object" }, // Enforce JSON output
    });

    const jsonString = chatCompletion.choices[0]?.message?.content || "{}";
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

        // Transcribe all audio files from their URLs in parallel
        const readingTranscripts = await Promise.all(
            readingResults.map(async (r: any) => ({
                originalText: r.originalText,
                transcribedText: await transcribeAudioFromUrl(r.audioUrl),
                audioUrl: r.audioUrl
            }))
        );

        const repetitionTranscripts = await Promise.all(
            repetitionResults.map(async (r: any) => ({
                originalText: r.originalText,
                transcribedText: await transcribeAudioFromUrl(r.audioUrl),
                audioUrl: r.audioUrl
            }))
        );

        // Use the new Groq analysis function
        const groqAnalysis = await analyzePerformanceWithGroq(readingTranscripts, repetitionTranscripts);
        
        const readingScore = groqAnalysis.scores.reading;
        const repetitionScore = groqAnalysis.scores.repetition;
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
                reportText: groqAnalysis.reportText,
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
        const readingPaths = readingTranscripts.map((r: any) => r.audioUrl.substring(r.audioUrl.lastIndexOf(user.id)));
        const repetitionPaths = repetitionTranscripts.map((r: any) => r.audioUrl.substring(r.audioUrl.lastIndexOf(user.id)));
        
        if (readingPaths.length > 0 || repetitionPaths.length > 0) {
            await supabase.storage.from('audio-uploads').remove([...readingPaths, ...repetitionPaths]);
        }

        return NextResponse.json({ sessionId: newSessionId, analysis: newSession.feedback });

    } catch (error: any) {
        console.error("Error in /api/analyze:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
