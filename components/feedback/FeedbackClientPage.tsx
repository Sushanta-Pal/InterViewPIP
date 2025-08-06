// 2. Replace this code in: components/feedback/FeedbackClientPage.tsx
// This is the new, enhanced feedback page UI.

'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import type { Session } from '@/lib/types';
import { BookOpen, Repeat, BrainCircuit, TrendingUp } from 'lucide-react';

// Helper to determine score color for visual feedback
const getScoreColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'text-slate-500';
    if (score >= 85) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
};

// A small component for the score breakdown cards
const ScoreBreakdownCard = ({ title, score, icon }: { title: string, score: number, icon: React.ReactNode }) => (
    <Card className="text-center">
        <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                {icon}
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {score}<span className="text-2xl text-slate-400">/100</span>
            </p>
        </CardContent>
    </Card>
);

export default function FeedbackClientPage({ session }: { session: Session }) {
    const router = useRouter();
    const { scores, reportText } = session.feedback;
    
    return (
        <div className="space-y-8">
            <Card className="text-center shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Session Report</CardTitle>
                    <p className="text-slate-500 dark:text-slate-400">{session.date}</p>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overall Score</p>
                    <p className={`text-7xl font-bold ${getScoreColor(scores.overall)}`}>
                        {scores.overall}
                        <span className="text-4xl text-slate-400">/100</span>
                    </p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreBreakdownCard title="Reading Score" score={scores.reading} icon={<BookOpen className="h-6 w-6 text-slate-500" />} />
                <ScoreBreakdownCard title="Repetition Score" score={scores.repetition} icon={<Repeat className="h-6 w-6 text-slate-500" />} />
                <ScoreBreakdownCard title="Comprehension Score" score={scores.comprehension} icon={<BrainCircuit className="h-6 w-6 text-slate-500" />} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed AI Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                    <div 
                        className="prose prose-lg dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: reportText }}
                    />
                </CardContent>
            </Card>

            <div className="text-center">
                <Button size="lg" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
}
