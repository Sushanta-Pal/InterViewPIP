// 1. Create this file: app/feedback/[sessionId]/page.tsx
// This is the SERVER component. It fetches data and handles routing logic.

import { auth } from '@clerk/nextjs/server';
import { getUserProfile } from '@/lib/userActions';
import FeedbackClientPage from '@/components/feedback/FeedbackClientPage';
import { notFound } from 'next/navigation';

// Define the props type for the page, which comes from the folder name [sessionId]
type FeedbackPageProps = {
    params: { sessionId: string };
};

export default async function FeedbackPage({ params }: FeedbackPageProps) {
    const { userId } = auth();
    // If the user isn't logged in, Next.js will show a 404 page.
    if (!userId) {
        return notFound();
    }

    const { sessionId } = params;
    const userProfile = await getUserProfile(userId);
    
    // Find the specific session from the user's history array
    const sessionData = userProfile?.session_history?.find(s => s.id === sessionId) || null;

    // If the session ID in the URL doesn't match any session for this user, show a 404 page.
    if (!sessionData) {
        return notFound();
    }

    // If data is found, render the client component and pass the session data to it as a prop.
    return <FeedbackClientPage session={sessionData} />;
}
