
// 2. Create this new file: components/dashboard/DashboardClientPage.tsx
// This is the Client Component that displays the data and handles user interaction.

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { PlusCircle, History } from 'lucide-react';
import type { UserProfile } from '@/lib/userActions';

// Define the props this component expects
interface DashboardClientPageProps {
    profile: UserProfile | null;
}

export default function DashboardClientPage({ profile }: DashboardClientPageProps) {
    const router = useRouter();

    // Function to handle clicking on a session to view its feedback
    const handleSessionClick = (sessionId: string) => {
        router.push(`/feedback/${sessionId}`);
    };

    return (
        <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome, {profile?.username || 'User'}!
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                        What would you like to work on today?
                    </p>
                </div>
                <Link href="/communication-practice">
                    <Button size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" /> Start New Session
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <History className="mr-3 h-6 w-6" /> Session History
                    </CardTitle>
                    <CardDescription>
                        Review your past practice sessions and detailed feedback reports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {profile?.session_history && profile.session_history.length > 0 ? (
                        <ul className="space-y-4">
                            {/* Sort sessions by date, newest first */}
                            {[...profile.session_history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session) => (
                                <li 
                                    key={session.id} 
                                    onClick={() => handleSessionClick(session.id)}
                                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-semibold text-lg">{session.type} Practice</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{session.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-2xl text-blue-500">
                                            {session.score}
                                            <span className="text-base text-slate-400"> / 100</span>
                                        </p>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">View Report &rarr;</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Sessions Yet</h3>
                            <p className="text-slate-500 mt-2">Click "Start New Session" to begin your first practice.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
