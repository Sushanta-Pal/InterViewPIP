import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import FeedbackClientPage from "@/components/feedback/FeedbackClientPage";
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Session } from "@/lib/types";

// Initialize the Supabase admin client for server-side fetching
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export default async function FeedbackPage({ params }: { params: { sessionId: string } }) {
    const { userId } = auth();
    if (!userId) {
        redirect('/sign-in');
    }

    const { sessionId } = params; // This is the BullMQ job ID

    // Fetch the user's profile to access the session history array
    const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('session_history')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        console.error("Error fetching user profile for feedback:", error);
        return notFound();
    }
    
    // Find the specific session from the user's history array using the ID
    const sessionData = userProfile?.session_history?.find((s: Session) => s.id === sessionId) || null;

    if (!sessionData) {
        // This can happen if the session is still being processed or if the ID is invalid
        console.warn(`Session with ID ${sessionId} not found for user ${userId}`);
        return notFound();
    }

    return (
        <div className="container mx-auto py-8">
            <FeedbackClientPage session={sessionData} />
        </div>
    );
}
