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
        const resultsString = formData.get('results') as string;
        const userProfileString = formData.get('userProfile') as string;

        if (!resultsString || !userProfileString) {
            return new NextResponse("Missing results or user profile data", { status: 400 });
        }
        
        const allResults = JSON.parse(resultsString);
        const userProfile = JSON.parse(userProfileString);

        const jobPayload: any = { 
            userId: user.id, 
            allResults,
            userProfile,
            readingAudio: [], 
            repetitionAudio: [] 
        };

        const uploadPromises: Promise<any>[] = [];

        // --- CORRECTED UPLOAD LOGIC ---
        allResults.reading.forEach((item: any, i: number) => {
            const file = formData.get(`reading_audio_${i}`);
            
            // Check if the entry is a valid, non-empty File object
            if (file instanceof File && file.size > 0) {
                const filename = `reading_${user.id}_${Date.now()}_${i}.webm`;
                uploadPromises.push(
                    put(filename, file, { access: 'public' }).then(blob => {
                        jobPayload.readingAudio[i] = { url: blob.url, originalText: item.originalText };
                    })
                );
            }
        });

        allResults.repetition.forEach((item: any, i: number) => {
            const file = formData.get(`repetition_audio_${i}`);

            // Check if the entry is a valid, non-empty File object
            if (file instanceof File && file.size > 0) {
                const filename = `repetition_${user.id}_${Date.now()}_${i}.webm`;
                uploadPromises.push(
                    put(filename, file, { access: 'public' }).then(blob => {
                        jobPayload.repetitionAudio[i] = { url: blob.url, originalText: item.originalText };
                    })
                );
            }
        });

        await Promise.all(uploadPromises);

        const job = await analysisQueue.add('process-analysis', jobPayload);

        return NextResponse.json({ message: "Analysis has started.", jobId: job.id }, { status: 202 });

    } catch (error: any) {
        console.error("Error enqueuing job:", error);
        // Provide a more specific error message if possible
        const errorMessage = error.message || "Failed to start analysis.";
        return new NextResponse(errorMessage, { status: 500 });
    }
}