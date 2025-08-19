import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/Card";
import CustomProfileForm from "./_components/CustomProfileForm";
import type { UserProfile } from '@/lib/types';

export default async function ProfilePage() {
    const supabase = createServerComponentClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/login');
    }

    // Fetch the user's profile from the user_details table
    const { data: profile } = await supabase
        .from('user_details')
        .select('*')
        .eq('email', session.user.email)
        .single();
    
    // Prepare the initial data for the form
    const initialData: UserProfile = {
        full_name: profile?.full_name || '',
        university: profile?.university || '',
        roll_number: profile?.roll_number || '',
        date_of_birth: profile?.date_of_birth || '',
        department: profile?.department || '',
        gender: profile?.gender || '',
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Your Profile</h1>
                <p className="text-slate-500">
                    Manage your personal information and account settings.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your custom profile details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CustomProfileForm initialData={initialData} />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account & Security</CardTitle>
                            <CardDescription>Manage your email and password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium">Email: {session.user.email}</p>
                            <p className="text-sm text-slate-500 mt-4">Feature to update password coming soon.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}