// app/api/analyze/route.ts

import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { analysisQueue } from '@/lib/queue'; // Make sure this path is correct

export async function POST(request: Request) {
    const user = await currentUser();
    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // 1. Get the clean JSON payload from the request body
        const jobPayload = await request.json();

        // 2. Add the job directly to the queue
        // The payload already contains the user ID, profile, and uploaded file paths
        const job = await analysisQueue.add('process-analysis', jobPayload);

        // 3. Respond instantly
        return NextResponse.json({ message: "Analysis has started.", jobId: job.id }, { status: 202 });

    } catch (error: any) {
        console.error("Error enqueuing job in /api/analyze:", error);
        const errorMessage = error.message || "Failed to start analysis.";
        return new NextResponse(errorMessage, { status: 500 });
    }
}