import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import FeedbackClientPage from "@/components/feedback/FeedbackClientPage";
import type { Session } from "@/lib/types";
import { createClient } from '@supabase/supabase-js';

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

    // The sessionId from the URL is the BullMQ job ID
    const jobId = params.sessionId;

    // Fetch the session data directly from the 'practice_sessions' table using the job_id
    const { data: sessionRecord, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', userId) // Security check to ensure the user owns the session
        .single();

    if (error || !sessionRecord) {
        console.error('Error fetching session from DB or session not found:', error);
        return (
            <div className="container mx-auto py-8 text-center">
                <h1 className="text-2xl font-bold">Session Not Found</h1>
                <p className="text-slate-500">Could not retrieve the details for this session. It might still be processing or does not exist.</p>
            </div>
        );
    }

    // Re-shape the database record to match the 'Session' type expected by the client component
    const session: Session = {
        id: sessionRecord.id, // The UUID from the database
        type: sessionRecord.session_type || "Communication",
        date: new Date(sessionRecord.created_at).toISOString(),
        score: sessionRecord.scores.overall,
        feedback: {
            scores: sessionRecord.scores,
            reportText: sessionRecord.feedback_report,
        },
    };

    return (
        <div className="container mx-auto py-8">
            <FeedbackClientPage session={session} />
        </div>
    );
}
