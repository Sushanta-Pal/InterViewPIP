// app/api/analyze/route.ts

import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { analysisQueue } from '@/lib/queue';

// Initialize the Supabase client for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Use the Service Key for backend access
);

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
            userProfile,
            allResults: { comprehension: allResults.comprehension },
            readingAudio: [], 
            repetitionAudio: [] 
        };

        const uploadPromises: Promise<any>[] = [];

        // --- SERVER-SIDE UPLOAD LOGIC ---
        const processFileUpload = async (file: File | null, type: 'reading' | 'repetition', index: number, originalText: string) => {
            if (file instanceof File && file.size > 0) {
                const filePath = `${user.id}/${type}_${Date.now()}_${index}.webm`;

                const { error: uploadError } = await supabase.storage
                    .from('audio-uploads')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('audio-uploads').getPublicUrl(filePath);
                
                if (type === 'reading') {
                    jobPayload.readingAudio[index] = { url: data.publicUrl, path: filePath, originalText };
                } else {
                    jobPayload.repetitionAudio[index] = { url: data.publicUrl, path: filePath, originalText };
                }
            }
        };

        allResults.reading.forEach((item: any, i: number) => {
            const file = formData.get(`reading_audio_${i}`);
            uploadPromises.push(processFileUpload(file as File, 'reading', i, item.originalText));
        });

        allResults.repetition.forEach((item: any, i: number) => {
            const file = formData.get(`repetition_audio_${i}`);
            uploadPromises.push(processFileUpload(file as File, 'repetition', i, item.originalText));
        });

        await Promise.all(uploadPromises);

        const job = await analysisQueue.add('process-analysis', jobPayload);

        return NextResponse.json({ message: "Analysis has started.", jobId: job.id }, { status: 202 });

    } catch (error: any) {
        console.error("Error in /api/analyze route:", error);
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 });
    }
}