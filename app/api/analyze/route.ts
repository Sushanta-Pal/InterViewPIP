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

// --- NEW: Gemini Helper to analyze a SINGLE task ---
async function analyzeSingleTask(originalText: string, transcribedText: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API key not configured.");
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    const prompt = `
        You are an expert linguistic analyst. Your task is to compare an "Original Text" with a "User's Speech" transcript and provide a detailed, objective analysis.

        Original Text: "${originalText}"
        User's Speech: "${transcribedText}"

        Your analysis must be based on the following criteria:
        1.  **Word Count Comparison**: Count the number of words in the Original Text and the User's Speech.
        2.  **Error Analysis**: Identify the number of insertions (extra words), deletions (missed words), and substitutions (mispronounced words).
        3.  **Scoring**:
            - **Accuracy Score (0-100):** Calculate this based on the number of correct words divided by the total words in the original text, accounting for errors.
            - **Fluency Score (0-100):** Infer this from the transcript. If it's a perfect match, fluency is 100. If it's disjointed or has many errors, lower the score.
            - **Completeness Score (0-100):** Calculate this based on the number of words the user spoke divided by the number of words in the original text.

        CRITICAL RULE:
        - If the User's Speech is "[NO SPEECH DETECTED]" or "[TRANSCRIPTION FAILED]", all three scores (Accuracy, Fluency, Completeness) MUST be 0.

        You MUST return ONLY a valid JSON object. Do not include any other text, markdown formatting, or explanations. The JSON structure must be:
        {
          "accuracy": number,
          "fluency": number,
          "completeness": number
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

        // Transcribe all audio files from their URLs in parallel
        const readingTranscripts = await Promise.all(
            readingResults.map(async (r: any) => ({
                originalText: r.originalText,
                transcribedText: await transcribeAudioFromUrl(r.audioUrl),
                audioUrl: r.audioUrl // Keep the URL for deletion
            }))
        );

        const repetitionTranscripts = await Promise.all(
            repetitionResults.map(async (r: any) => ({
                originalText: r.originalText,
                transcribedText: await transcribeAudioFromUrl(r.audioUrl),
                audioUrl: r.audioUrl // Keep the URL for deletion
            }))
        );

        // Analyze each task individually for a more accurate score
        const readingAnalyses = await Promise.all(
            readingTranscripts.map(t => analyzeSingleTask(t.originalText, t.transcribedText))
        );
        const repetitionAnalyses = await Promise.all(
            repetitionTranscripts.map(t => analyzeSingleTask(t.originalText, t.transcribedText))
        );

        // Aggregate the scores from individual analyses
        const aggregateScores = (analyses: any[]) => {
            if (analyses.length === 0) return { accuracy: 0, fluency: 0, completeness: 0 };
            const total = analyses.reduce((acc, curr) => ({
                accuracy: acc.accuracy + curr.accuracy,
                fluency: acc.fluency + curr.fluency,
                completeness: acc.completeness + curr.completeness,
            }), { accuracy: 0, fluency: 0, completeness: 0 });
            return {
                accuracy: total.accuracy / analyses.length,
                fluency: total.fluency / analyses.length,
                completeness: total.completeness / analyses.length,
            };
        };

        const readingMetrics = aggregateScores(readingAnalyses);
        const repetitionMetrics = aggregateScores(repetitionAnalyses);
        
        // Calculate a more nuanced final score for each section
        const readingScore = (readingMetrics.accuracy * 0.5) + (readingMetrics.fluency * 0.3) + (readingMetrics.completeness * 0.2);
        const repetitionScore = (repetitionMetrics.accuracy * 0.5) + (repetitionMetrics.fluency * 0.3) + (repetitionMetrics.completeness * 0.2);

        const correctComprehension = comprehensionResults.filter((r: any) => r.isCorrect).length;
        const comprehensionScore = comprehensionResults.length > 0 ? (correctComprehension / comprehensionResults.length) * 100 : 0;
        
        const overallScore = (readingScore + repetitionScore + comprehensionScore) / 3;

        // Generate a final summary report with Gemini
        const finalReportPrompt = `
            Based on the following performance scores, generate a concise, positive, and actionable "reportText" (3-4 sentences).
            Reading Score: ${Math.round(readingScore)}/100
            Repetition Score: ${Math.round(repetitionScore)}/100
            Comprehension Score: ${Math.round(comprehensionScore)}/100
            Start with a positive observation, then offer one specific tip for improvement.
            Return ONLY the string for the reportText.
        `;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
        const reportResult = await model.generateContent(finalReportPrompt);
        const reportResponse = await reportResult.response;
        const reportText = reportResponse.text();

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
                reportText: reportText,
                detailedScores: { reading: readingMetrics, repetition: repetitionMetrics }
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
        await supabase.storage.from('audio-uploads').remove([...readingPaths, ...repetitionPaths]);

        return NextResponse.json({ sessionId: newSessionId, analysis: newSession.feedback });

    } catch (error: any) {
        console.error("Error in /api/analyze:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
