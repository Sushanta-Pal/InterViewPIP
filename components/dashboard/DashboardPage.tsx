// 1. Replace this code in: app/dashboard/page.tsx
// This is the Server Component that handles authentication and data fetching.

import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserProfile, createUserProfile } from '@/lib/userActions';
import DashboardClientPage from '@/components/dashboard/DashboardClientPage';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const { userId } = auth();
    const user = await currentUser();

    // If the user is not logged in, redirect them to the sign-in page.
    if (!userId || !user) {
        redirect('/sign-in');
    }

    // Attempt to fetch the user's profile from Supabase.
    let userProfile = await getUserProfile(userId);

    // If a profile doesn't exist, it's a new user. Create a profile for them.
    if (!userProfile) {
        userProfile = await createUserProfile(user);
    }

    // Render the client component and pass the user's profile data as a prop.
    return <DashboardClientPage profile={userProfile} />;
}
