// worker/analysisProcessor.ts
import { Job } from 'bullmq';
import { geminiKeyManager, deepgramKeyManager } from '../lib/apiKeyManager';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
// --- 1. Import the database action and the Session type ---
import { addSessionToHistory } from '../lib/userActions';
import type { Session } from '../lib/types';

// --- TRANSCRIPTION FUNCTION (USES KEY ROTATION) ---
async function transcribeAudio(audioUrl: string): Promise<string> {
    const apiKey = deepgramKeyManager.getNextKey();
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
        method: "POST",
        headers: { Authorization: `Token ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: audioUrl }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Deepgram failed for URL ${audioUrl}: ${errorText}`);
        throw new Error(`Deepgram transcription failed.`);
    }
    const data = await response.json();
    return data.results?.channels[0]?.alternatives[0]?.transcript || "[No speech detected]";
}

// --- GEMINI ANALYSIS FUNCTION (USES KEY ROTATION) ---
async function getAiFeedback(transcripts: any, comprehensionResults: any, apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const readingTasks = transcripts.reading.map((item: any) => `Original: "${item.originalText}"\nUser: "${item.transcript}"`).join('\n\n');
    const repetitionTasks = transcripts.repetition.map((item: any) => `Original: "${item.originalText}"\nUser: "${item.transcript}"`).join('\n\n');
    const comprehensionScore = Math.round((comprehensionResults.filter((r: any) => r.isCorrect).length / comprehensionResults.length) * 100) || 100;

    const prompt = `
        You are an expert communication coach. Analyze the user's performance.
        If a transcript is "[No speech detected]", score it as 0.

        PART 1: READING ALOUD\n${readingTasks}
        PART 2: REPETITION\n${repetitionTasks}

        ANALYSIS TASK:
        1. Calculate a 'reading' score (0-100).
        2. Calculate a 'repetition' score (0-100).
        3. The 'comprehension' score is ${comprehensionScore}.
        4. Calculate an 'overall' score by averaging the three.
        5. Write a detailed 'reportText' in HTML format with feedback.

        Return a single JSON object:
        {
          "scores": { "overall": number, "reading": number, "repetition": number, "comprehension": number },
          "reportText": "<html>_string"
        }
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}

// --- DEFAULT EXPORT: THE JOB PROCESSOR ---
export default async function (job: Job) {
    console.log(`Processing job ${job.id}`);
    const { userId, allResults, readingAudio, repetitionAudio } = job.data;

    try {
        const transcripts = { reading: [] as any[], repetition: [] as any[] };

        const transcriptionPromises = [
            ...readingAudio.map(async (item: any) => {
                const transcript = await transcribeAudio(item.url);
                transcripts.reading.push({ originalText: item.originalText, transcript });
            }),
            ...repetitionAudio.map(async (item: any) => {
                const transcript = await transcribeAudio(item.url);
                transcripts.repetition.push({ originalText: item.originalText, transcript });
            })
        ];

        await Promise.all(transcriptionPromises);

        const geminiApiKey = geminiKeyManager.getNextKey();
        const analysis = await getAiFeedback(transcripts, allResults.comprehension, geminiApiKey);

        // --- 2. Create the session object ---
        const newSession: Session = {
            id: job.id!, // Use the BullMQ job ID as the unique session ID
            type: "Communication",
            date: new Date().toISOString(),
            score: analysis.scores.overall,
            feedback: analysis, // The entire analysis object is stored here
        };

        // --- 3. Call the database function to save the session ---
        await addSessionToHistory(userId, newSession);

        console.log(`Analysis for user ${userId} complete and saved to DB. Overall score: ${analysis.scores.overall}`);

        return analysis;
    } catch (error: any) {
        console.error(`Job ${job.id} failed:`, error.message);
        throw error;
    }
};
