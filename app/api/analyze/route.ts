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

// --- HELPER FUNCTION FOR SUPABASE UPLOAD ---
async function uploadToSupabase(file: File, userId: string, fileName: string) {
    // Create a unique path for the file in the bucket
    const filePath = `${userId}/${fileName}`;

    // Upload the file to the 'audio-uploads' bucket
    const { error: uploadError } = await supabase.storage
        .from('audio-uploads')
        .upload(filePath, file);

    if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    // Get the public URL for the newly uploaded file
    const { data } = supabase.storage
        .from('audio-uploads')
        .getPublicUrl(filePath);
    
    if (!data || !data.publicUrl) {
        throw new Error('Could not get public URL from Supabase.');
    }

    // Return both the public URL and the file path for later deletion
    return { publicUrl: data.publicUrl, filePath };
}
// -------------------------------------------

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

        // --- NEW SUPABASE UPLOAD LOGIC ---
        allResults.reading.forEach((item: any, i: number) => {
            const file = formData.get(`reading_audio_${i}`);
            
            if (file instanceof File && file.size > 0) {
                const filename = `reading_${Date.now()}_${i}.webm`;
                uploadPromises.push(
                    uploadToSupabase(file, user.id, filename).then(supaFile => {
                        jobPayload.readingAudio[i] = { 
                            url: supaFile.publicUrl, 
                            path: supaFile.filePath, // Pass filePath for deletion
                            originalText: item.originalText 
                        };
                    })
                );
            }
        });

        allResults.repetition.forEach((item: any, i: number) => {
            const file = formData.get(`repetition_audio_${i}`);

            if (file instanceof File && file.size > 0) {
                const filename = `repetition_${Date.now()}_${i}.webm`;
                uploadPromises.push(
                    uploadToSupabase(file, user.id, filename).then(supaFile => {
                        jobPayload.repetitionAudio[i] = { 
                            url: supaFile.publicUrl, 
                            path: supaFile.filePath, // Pass filePath for deletion
                            originalText: item.originalText 
                        };
                    })
                );
            }
        });

        await Promise.all(uploadPromises);

        const job = await analysisQueue.add('process-analysis', jobPayload);

        return NextResponse.json({ message: "Analysis has started.", jobId: job.id }, { status: 202 });

    } catch (error: any) {
        console.error("Error in /api/analyze route:", error);
        return new NextResponse(error.message, { status: 500 });
    }
}