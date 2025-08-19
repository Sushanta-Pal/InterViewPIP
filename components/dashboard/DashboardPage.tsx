// 1. Replace this code in: app/dashboard/page.tsx
// This is the Server Component that handles authentication and data fetching.

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClientPage from '@/components/dashboard/DashboardClientPage';
import type { DashboardData } from '@/lib/types';

export default async function DashboardPage() {
    const supabase = createServerComponentClient({ cookies });

    // Get the current user session from Supabase
    const { data: { session } } = await supabase.auth.getSession();

    // If there is no session, redirect to the login page.
    if (!session) {
        redirect('/login');
    }

    // Attempt to fetch the user's dashboard data from your 'user_dashboard_data' table.
    const { data, error } = await supabase
        .from('user_dashboard_data')
        .select('*')
        .eq('user_email', session.user.email)
        .single();
    
    // This handles errors but ignores the case where a new user has no row yet.
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching dashboard data:", error);
    }

    // If a profile doesn't exist, provide a default object for the client page.
    // The backend will create the actual row after their first session.
    const dashboardData: DashboardData = data || {
        overall_average: 0,
        sessions_completed: 0,
        avg_reading: 0,
        avg_repetition: 0,
        avg_comprehension: 0,
        session_history: [],
    };

    // Render the client component and pass the user's profile data as a prop.
    // Note: The prop is named 'initialData' to match the client component.
    return <DashboardClientPage initialData={dashboardData} />;
}
