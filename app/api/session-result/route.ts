import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@/lib/types';

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
        // --- 1. Fetch the user's profile to access the session history array ---
        const { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('session_history')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If the profile doesn't exist yet, it's a pending state.
            if (error.code === 'PGRST116') {
                return NextResponse.json({ status: 'pending' });
            }
            console.error('Supabase error fetching user profile:', error);
            throw error;
        }

        // --- 2. Find the specific session within the session_history array ---
        const session = userProfile?.session_history?.find((s: Session) => s.id === sessionId) || null;

        if (session && session.feedback) {
            // Found the completed session, return its feedback object
            return NextResponse.json({ feedback: session.feedback });
        } else {
            // The session isn't in the history yet, so the job is still pending.
            return NextResponse.json({ status: 'pending' });
        }

    } catch (error) {
        console.error("Error in /api/session-result:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
