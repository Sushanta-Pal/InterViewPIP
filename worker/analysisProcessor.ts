import { Job } from 'bullmq';
import { geminiKeyManager, deepgramKeyManager } from '../lib/apiKeyManager';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@/lib/types'; // Make sure this type is available and correct

// Initialize the Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_KEY!
);

// --- TRANSCRIPTION AND AI FEEDBACK FUNCTIONS (No changes needed here) ---
async function transcribeAudio(audioUrl: string): Promise<string> {
    // ... (your existing transcribeAudio function)
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

async function getAiFeedback(transcripts: any, comprehensionResults: any, apiKey: string) {
    // ... (your existing getAiFeedback function)
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
                if (!item || !item.url) return;
                const transcript = await transcribeAudio(item.url);
                transcripts.reading.push({ originalText: item.originalText, transcript });
            }),
            ...repetitionAudio.map(async (item: any) => {
                if (!item || !item.url) return;
                const transcript = await transcribeAudio(item.url);
                transcripts.repetition.push({ originalText: item.originalText, transcript });
            })
        ];

        await Promise.all(transcriptionPromises);

        const geminiApiKey = geminiKeyManager.getNextKey();
        const analysis = await getAiFeedback(transcripts, allResults.comprehension, geminiApiKey);

        // --- 1. Fetch the user's current profile from the database ---
        const { data: currentProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('session_history')
            .eq('user_id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // Ignore 'not found' error, as we can create the profile
            console.error('Supabase fetch error:', fetchError);
            throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
        }

        // --- 2. Create the new session object ---
        const newSession: Session = {
            id: job.id!.toString(), // Use the BullMQ job ID as the unique session ID
            type: "Communication",
            date: new Date().toISOString(),
            score: analysis.scores.overall,
            feedback: analysis,
        };

        // --- 3. Append the new session to the existing history ---
        const existingHistory = currentProfile?.session_history || [];
        const updatedHistory = [...existingHistory, newSession];

        // --- 4. Recalculate all average scores ---
        let totalReading = 0, totalRepetition = 0, totalComprehension = 0, totalOverall = 0;
        updatedHistory.forEach(s => {
            totalReading += s.feedback.scores.reading || 0;
            totalRepetition += s.feedback.scores.repetition || 0;
            totalComprehension += s.feedback.scores.comprehension || 0;
            totalOverall += s.score || 0;
        });
        const count = updatedHistory.length;
        const average_reading_score = Math.round(totalReading / count);
        const average_repeating_score = Math.round(totalRepetition / count);
        const average_comprehension_score = Math.round(totalComprehension / count);
        const overall_average_score = Math.round(totalOverall / count);

        // --- 5. Upsert the entire profile with the updated history and scores ---
        const { error: upsertError } = await supabase
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
                session_history: updatedHistory, // Save the updated array
                average_reading_score,
                average_repeating_score,
                average_comprehension_score,
                overall_average_score,
            });

        if (upsertError) {
            console.error('Supabase profile upsert error:', upsertError);
            throw new Error('Failed to update user profile in database.');
        }
        
        console.log(`Job ${job.id} complete. User profile and session history updated for ${userId}.`);
        return analysis;

    } catch (error: any) {
        console.error(`Job ${job.id} failed:`, error.message);
        throw error;
    }
};
