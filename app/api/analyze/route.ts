// app/api/analyze/route.ts

import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { analysisQueue } from '@/lib/queue'; // Assuming your queue is in lib

// --- HELPER FUNCTION FOR GOOGLE DRIVE UPLOAD ---
async function uploadToGoogleDrive(file: File, userId: string, fileName: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const fileStream = Readable.from(fileBuffer);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    },
    media: {
      mimeType: file.type,
      body: fileStream,
    },
    fields: 'id',
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error(`Upload failed for ${fileName}`);
  }

  await drive.permissions.create({
    fileId: fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  const fileMetadata = await drive.files.get({
    fileId: fileId,
    fields: 'webContentLink',
  });

  const publicUrl = fileMetadata.data.webContentLink;
  if (!publicUrl) {
    throw new Error(`Could not get public URL for ${fileName}`);
  }

  return { fileId, publicUrl };
}
// -------------------------------------------------


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
            // These will be populated by the uploads
            readingAudio: [], 
            repetitionAudio: [] 
        };

        const uploadPromises: Promise<any>[] = [];

        // --- NEW GOOGLE DRIVE UPLOAD LOGIC ---
        allResults.reading.forEach((item: any, i: number) => {
            const file = formData.get(`reading_audio_${i}`);
            
            if (file instanceof File && file.size > 0) {
                const filename = `reading_${user.id}_${Date.now()}_${i}.webm`;
                uploadPromises.push(
                    uploadToGoogleDrive(file, user.id, filename).then(driveFile => {
                        jobPayload.readingAudio[i] = { 
                            url: driveFile.publicUrl, 
                            fileId: driveFile.fileId, // Pass fileId for deletion
                            originalText: item.originalText 
                        };
                    })
                );
            }
        });

        allResults.repetition.forEach((item: any, i: number) => {
            const file = formData.get(`repetition_audio_${i}`);

            if (file instanceof File && file.size > 0) {
                const filename = `repetition_${user.id}_${Date.now()}_${i}.webm`;
                uploadPromises.push(
                    uploadToGoogleDrive(file, user.id, filename).then(driveFile => {
                        jobPayload.repetitionAudio[i] = { 
                            url: driveFile.publicUrl, 
                            fileId: driveFile.fileId, // Pass fileId for deletion
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
        const errorMessage = error.message || "Failed to start analysis.";
        return new NextResponse(errorMessage, { status: 500 });
    }
}