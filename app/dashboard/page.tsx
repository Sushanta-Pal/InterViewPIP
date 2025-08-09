// app/dashboard/page.tsx

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DashboardClientPage from '@/components/dashboard/DashboardClientPage';
import type { UserProfile } from '@/lib/types';

// Initialize the Supabase admin client for server-side data fetching
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export default async function DashboardPage() {
    const { userId } = auth();
    if (!userId) {
        redirect('/sign-in');
    }

    // --- Fetch the complete user profile in a single query ---
    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'not found' error for new users
        console.error("Error fetching dashboard data:", error);
    }

    // The 'profile' object now contains everything the client page needs.
    return <DashboardClientPage profile={profile as UserProfile | null} />;
}