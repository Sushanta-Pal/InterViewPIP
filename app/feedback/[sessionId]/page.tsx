// 1. Place this code in: app/feedback/[sessionId]/page.tsx
// This is the SERVER component that fetches data for a specific session.

import { auth } from '@clerk/nextjs/server';
import { getUserProfile } from '@/lib/userActions';
import FeedbackClientPage from '@/components/feedback/FeedbackClientPage';
import { notFound } from 'next/navigation';

// The props for this page will include `params` with a `sessionId`
type FeedbackPageProps = {
    params: { sessionId: string };
};

export default async function FeedbackPage({ params }: FeedbackPageProps) {
    const { userId } = auth();
    // If the user isn't logged in, show a 404 page
    if (!userId) {
        return notFound();
    }

    const { sessionId } = params;
    const userProfile = await getUserProfile(userId);
    
    // Find the specific session from the user's history using the ID from the URL
    const sessionData = userProfile?.session_history?.find(s => s.id === sessionId) || null;

    // If no session with that ID is found for the user, show a 404 page
    if (!sessionData) {
        return notFound();
    }

    // Render the client component, passing the found session data as a prop
    return <FeedbackClientPage session={sessionData} />;
}