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
    const sessionId = searchParams.get('sessionId'); // This is the BullMQ job ID

    if (!sessionId) {
        return new NextResponse("Session ID is required", { status: 400 });
    }

    try {
        // CORRECTED: Query the 'job_id' column instead of the 'id' column
        const { data, error } = await supabase
            .from('practice_sessions')
            .select('scores, feedback_report')
            .eq('job_id', sessionId) // <-- THIS IS THE FIX
            .eq('user_id', userId)   // Security check to ensure the user owns this session
            .single();

        if (error) {
            // This error means the row was not found, which is normal while the worker is processing.
            if (error.code === 'PGRST116') { 
                return NextResponse.json({ status: 'pending' });
            }
            // For any other database errors, log them.
            console.error('Supabase error fetching session result:', error);
            throw error;
        }

        // If data was found, check if the worker has populated the fields.
        if (data && data.scores && data.feedback_report) {
            const feedback = {
                scores: data.scores,
                reportText: data.feedback_report,
            };
            return NextResponse.json({ feedback });
        } else {
            // The row might exist but is not yet populated by the worker.
            return NextResponse.json({ status: 'pending' });
        }

    } catch (error) {
        console.error("Error in /api/session-result:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
