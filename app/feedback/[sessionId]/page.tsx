import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import FeedbackClientPage from '@/components/feedback/FeedbackClientPage';
import type { Session } from '@/lib/types';

export default async function FeedbackPage({ params }: { params: { sessionId: string } }) {
    const supabase = createServerComponentClient({ cookies });
    const { sessionId } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Fetch the user's entire dashboard data
    const { data: dashboardData } = await supabase
        .from('user_dashboard_data')
        .select('session_history')
        .eq('user_email', user.email)
        .single();

    if (!dashboardData || !dashboardData.session_history) {
        return notFound();
    }

    // Find the specific session from the history array
    const session = (dashboardData.session_history as Session[]).find(s => s.id === sessionId);

    if (!session) {
        return notFound();
    }

    return <FeedbackClientPage session={session} />;
}
