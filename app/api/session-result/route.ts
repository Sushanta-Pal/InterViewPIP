import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase admin client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
    const { userId } = auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return new NextResponse("Session ID is required", { status: 400 });
    }

    try {
        // Query the 'practice_sessions' table for the specific session ID.
        // We also check that the user_id matches to enforce security.
        const { data, error } = await supabase
            .from('practice_sessions')
            .select('scores, feedback_report')
            .eq('id', sessionId)
            .eq('user_id', userId) // Security check
            .single();

        if (error) {
            // This specific error code means the row was not found.
            // This is expected while the worker is still processing the job.
            if (error.code === 'PGRST116') {
                return NextResponse.json({ status: 'pending' });
            }
            // For other errors, log them and return a server error.
            console.error('Supabase error fetching session result:', error);
            throw error;
        }

        // Check if the worker has populated the scores and report fields.
        if (data && data.scores && data.feedback_report) {
            // The job is done. Construct the feedback object the frontend expects.
            const feedback = {
                scores: data.scores,
                reportText: data.feedback_report,
            };
            return NextResponse.json({ feedback });
        } else {
            // The row might exist, but the data isn't ready yet.
            return NextResponse.json({ status: 'pending' });
        }

    } catch (error) {
        console.error("Error in /api/session-result:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
