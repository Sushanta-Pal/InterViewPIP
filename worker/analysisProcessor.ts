// worker/analysisProcessor.ts

import { Job } from 'bullmq';
import { geminiKeyManager, deepgramKeyManager } from '../lib/apiKeyManager';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@/lib/types';

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_KEY!
);

// --- HELPER FUNCTIONS (No changes needed for transcribe and getAiFeedback) ---

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

async function getAiFeedback(transcripts: any, comprehensionResults: any, apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const readingTasks = transcripts.reading.map((item: any) => `Original: "${item.originalText}"\nUser: "${item.transcript}"`).join('\n\n');
    const repetitionTasks = transcripts.repetition.map((item: any) => `Original: "${item.originalText}"\nUser: "${item.transcript}"`).join('\n\n');
    
    const comprehensionScore = comprehensionResults.length > 0
        ? Math.round((comprehensionResults.filter((r: any) => r.isCorrect).length / comprehensionResults.length) * 100)
        : 0;

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

// --- MAIN JOB PROCESSOR ---
export default async function (job: Job) {
    console.log(`Processing job ${job.id}`);
    const { userId, allResults, userProfile, readingAudio, repetitionAudio } = job.data;

    try {
        const transcripts = { reading: [] as any[], repetition: [] as any[] };

        // Transcription promises remain the same, as they use the public URL
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
        
        // --- Database update logic remains the same ---
        const { data: currentProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('session_history')
            .eq('user_id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw new Error(`Failed to fetch user profile: ${fetchError.message}`);
        }

        const newSession: Session = {
            id: job.id!.toString(),
            type: "Communication",
            date: new Date().toISOString(),
            score: analysis.scores.overall,
            feedback: analysis,
        };

        const existingHistory = currentProfile?.session_history || [];
        const updatedHistory = [...existingHistory, newSession];

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

        const { error: upsertError } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: userId, email: userProfile.email, username: userProfile.fullName,
                full_name: userProfile.fullName, university: userProfile.university, roll_no: userProfile.roll,
                dob: userProfile.dob, stream: userProfile.stream, gender: userProfile.gender,
                session_history: updatedHistory, average_reading_score, average_repeating_score,
                average_comprehension_score, overall_average_score,
            });

        if (upsertError) {
            throw new Error('Failed to update user profile in database.');
        }
        
        console.log(`Job ${job.id} complete. User profile updated for ${userId}.`);

    } catch (error: any) {
        console.error(`Job ${job.id} failed:`, error.message);
        throw error; // Re-throw the error to let BullMQ know the job failed
    } finally {
          // --- NEW: SUPABASE STORAGE CLEANUP LOGIC ---
        console.log(`[Job ${job.id}] Starting Supabase Storage cleanup...`);

        // Collect all file paths from the job data
        const filePathsToDelete = [
            ...readingAudio.map((item: any) => item?.path),
            ...repetitionAudio.map((item: any) => item?.path)
        ].filter(path => path); // Filter out any null/undefined entries

        if (filePathsToDelete.length > 0) {
            
            // =================================================================
            // === IMPORTANT: For testing, the delete logic is commented out. ===
            // === UNCOMMENT THE FOLLOWING BLOCK FOR PRODUCTION.               ===
            // =================================================================
            /*
            try {
                const { error: removeError } = await supabase.storage
                    .from('audio-uploads') // Use your bucket name
                    .remove(filePathsToDelete);

                if (removeError) {
                    throw removeError;
                }

                console.log(`[Job ${job.id}] Successfully deleted ${filePathsToDelete.length} files from Supabase Storage.`);

            } catch (cleanupError: any) {
                console.error(`[Job ${job.id}] FAILED to delete files from Supabase Storage:`, cleanupError.message);
            }
            */
            // =================================================================
            
            console.log(`[Job ${job.id}] TEST MODE: Would have deleted ${filePathsToDelete.length} files. Cleanup logic is commented out.`);
        } else {
            console.log(`[Job ${job.id}] No files to delete from Supabase Storage.`);
        }
    }
}