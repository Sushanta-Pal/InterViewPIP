// app/dashboard/page.tsx

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClientPage from '@/components/dashboard/DashboardClientPage';
import type { DashboardData } from '@/lib/types'; // Make sure this type is defined

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // 1. Get the current user's session from Supabase
  const { data: { session } } = await supabase.auth.getSession();

  // 2. If there's no user session, send them to the login page
  if (!session) {
    redirect('/login');
  }

  // 3. Fetch the dashboard data from your 'user_dashboard_data' table
  const { data, error } = await supabase
    .from('user_dashboard_data')
    .select('*')
    .eq('user_email', session.user.email) // Use the user's email to find their data
    .single();

  // This handles the case where a brand new user might not have a dashboard entry yet
  if (error && error.code !== 'PGRST116') { // PGRST116 means 'no rows found', which is okay
    console.error("Error fetching dashboard data:", error);
  }

  // 4. Prepare the data for the client component. If no data is found, provide a default object.
  const dashboardData: DashboardData = data || {
    overall_average: 0,
    sessions_completed: 0,
    avg_reading: 0,
    avg_repetition: 0,
    avg_comprehension: 0,
    session_history: [],
  };

  // The 'profile' prop in DashboardClientPage might need to be renamed to 'initialData' or similar
  return <DashboardClientPage initialData={dashboardData} />;
}