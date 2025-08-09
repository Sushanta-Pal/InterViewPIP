import { Job } from 'bullmq';
import { geminiKeyManager, deepgramKeyManager } from '../lib/apiKeyManager';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_KEY!
);

// --- TRANSCRIPTION FUNCTION (No changes needed) ---
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

// --- GEMINI ANALYSIS FUNCTION (No changes needed) ---
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
    const { userId, allResults, userProfile, readingAudio, repetitionAudio } = job.data;

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

        // --- Upsert the user's profile with their latest info ---
        const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: userId,
                email: userProfile.email,
                username: userProfile.fullName,
                full_name: userProfile.fullName,
                university: userProfile.university,
                roll_no: userProfile.roll,
                dob: userProfile.dob,
                stream: userProfile.stream,
                gender: userProfile.gender,
            });

        if (profileError) {
            console.error('Supabase profile upsert error:', profileError);
            throw new Error('Failed to update user profile in database.');
        }

        // --- CORRECTED: Insert the new session record ---
        const { data: sessionData, error: sessionError } = await supabase
            .from('practice_sessions')
            .insert({
                // REMOVED: id: job.id,
                job_id: job.id, // ADDED: Save the job ID in the correct column
                user_id: userId,
                scores: analysis.scores,
                feedback_report: analysis.reportText,
            })
            .select('id') // Select the new UUID that Supabase generated
            .single();

        if (sessionError) {
            console.error('Supabase session insert error:', sessionError);
            throw new Error('Failed to save session to database.');
        }
        
        console.log(`Analysis for job ${job.id} complete and saved to session ${sessionData.id}.`);

        return analysis;

    } catch (error: any) {
        console.error(`Job ${job.id} failed:`, error.message);
        throw error;
    }
};
