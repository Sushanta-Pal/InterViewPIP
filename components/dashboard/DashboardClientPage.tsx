
"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Button  from "@/components/common/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/Card"
import {
  PlusCircle,
  TrendingUp,
  Target,
  BookOpen,
  Repeat,
  History,
  Puzzle, // Added Puzzle Icon
} from "lucide-react"
import StatCard from "../common/StatCard"
import { UserProfile } from "@/lib/types"

const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
};

export default function DashboardClientPage({ profile }: { profile: UserProfile | null }) {
    const router = useRouter();

    const handleSessionClick = (sessionId: string) => {
        router.push(`/feedback/${sessionId}`);
    };

    const overallScore = profile?.overall_average_score ?? 0;
    const totalSessions = profile?.session_history?.length ?? 0;
    const sortedHistory = profile?.session_history ? [...profile.session_history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome, {profile?.username || 'User'}!
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                        Here's your performance overview. Let's get practicing!
                    </p>
                </div>
                <Link href="/communication-practice">
                    <Button size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" /> Start New Session
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Overall Average" 
                    value={`${overallScore} / 100`}
                    icon={<TrendingUp className="h-4 w-4 text-slate-500" />}
                    description="Across all sessions"
                />
                <StatCard 
                    title="Sessions Completed" 
                    value={totalSessions}
                    icon={<Target className="h-4 w-4 text-slate-500" />}
                    description="Keep up the great work!"
                />
                 <StatCard 
                    title="Avg. Reading Score" 
                    value={profile?.average_reading_score ?? 'N/A'}
                    icon={<BookOpen className="h-4 w-4 text-slate-500" />}
                    description="Clarity and accuracy"
                />
                 <StatCard 
                    title="Avg. Repetition Score" 
                    value={profile?.average_repeating_score ?? 'N/A'}
                    icon={<Repeat className="h-4 w-4 text-slate-500" />}
                    description="Listening and recall"
                />
                <StatCard
                    title="Avg. Comprehension Score"
                    value={profile?.average_comprehension_score ?? 'N/A'}
                    icon={<Puzzle className="h-4 w-4 text-slate-500" />}
                    description="Understanding and analysis"
                />
            </div>

            {/* Session History Card */}
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
                    {sortedHistory.length > 0 ? (
                        <div className="space-y-4">
                            {sortedHistory.map((session) => (
                                <div 
                                    key={session.id} 
                                    onClick={() => handleSessionClick(session.id)}
                                    className="p-4 border rounded-lg flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-semibold text-lg">{session.type} Practice</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(session.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <p className={`font-bold text-2xl ${getScoreColor(session.score)}`}>
                                            {session.score}
                                            <span className="text-base text-slate-400"> / 100</span>
                                        </p>
                                        <Button variant="ghost" size="sm">View Report</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
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