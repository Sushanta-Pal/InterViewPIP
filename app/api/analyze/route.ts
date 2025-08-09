// app/api/analyze/route.ts

import { NextResponse } from 'next/server';
import { analysisQueue } from '@/lib/queue';
import { put } from '@vercel/blob';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: Request) {
    const user = await currentUser();
    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const formData = await request.formData();
        
        // --- Get both results and user profile from the form data ---
        const resultsString = formData.get('results') as string;
        const userProfileString = formData.get('userProfile') as string; // <-- ADD THIS LINE

        if (!resultsString || !userProfileString) {
             return new NextResponse("Missing results or user profile data", { status: 400 });
        }
        
        const allResults = JSON.parse(resultsString);
        const userProfile = JSON.parse(userProfileString); // <-- ADD THIS LINE

        // --- The job payload will now include the user's profile ---
        const jobPayload: any = { 
            userId: user.id, 
            allResults,
            userProfile, // <-- ADD THIS LINE
            readingAudio: [], 
            repetitionAudio: [] 
        };

        const uploadPromises: Promise<any>[] = [];

        // --- No changes needed for the audio upload logic ---
        allResults.reading.forEach((item: any, i: number) => {
            const audioBlob = formData.get(`reading_audio_${i}`) as Blob;
            if (audioBlob) {
                const filename = `reading_${user.id}_${Date.now()}_${i}.webm`;
                uploadPromises.push(
                    put(filename, audioBlob, { access: 'public' }).then(blob => {
                        jobPayload.readingAudio[i] = { url: blob.url, originalText: item.originalText };
                    })
                );
            }
        });

        allResults.repetition.forEach((item: any, i: number) => {
            const audioBlob = formData.get(`repetition_audio_${i}`) as Blob;
            if (audioBlob) {
                const filename = `repetition_${user.id}_${Date.now()}_${i}.webm`;
                uploadPromises.push(
                    put(filename, audioBlob, { access: 'public' }).then(blob => {
                        jobPayload.repetitionAudio[i] = { url: blob.url, originalText: item.originalText };
                    })
                );
            }
        });

        await Promise.all(uploadPromises);

        // --- Add the complete payload to the queue ---
        const job = await analysisQueue.add('process-analysis', jobPayload);

        return NextResponse.json({ message: "Analysis has started.", jobId: job.id }, { status: 202 });

    } catch (error: any) {
        console.error("Error enqueuing job:", error);
        return new NextResponse("Failed to start analysis.", { status: 500 });
    }
}