'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Progress } from "@/components/common/Progress";
import { Award, BookOpen, Repeat, Puzzle, ArrowLeft } from "lucide-react";
import type { Session } from '@/lib/types';

const ScoreIndicator = ({ label, score }: { label: string, score: number }) => {
    const getScoreColor = (s: number) => {
        if (s >= 85) return "bg-green-500";
        if (s >= 70) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
                <p className={`text-sm font-bold ${getScoreColor(score).replace('bg-', 'text-')}`}>{score}/100</p>
            </div>
            <Progress value={score} indicatorClassName={getScoreColor(score)} />
        </div>
    );
};

export default function FeedbackClientPage({ session }: { session: Session }) {
    const router = useRouter();

    if (!session || !session.feedback) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold">Feedback not available</h1>
                <p>We couldn't load the details for this session.</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </div>
        );
    }

    const { scores, reportText } = session.feedback;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <Button onClick={() => router.push('/dashboard')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>

            <Card className="shadow-xl">
                <CardHeader className="text-center">
                    <Award className="mx-auto h-12 w-12 text-yellow-500" />
                    <CardTitle className="text-3xl mt-2">Session Report</CardTitle>
                    <CardDescription>
                        {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-slate-500">Overall Score</p>
                        <p className="text-7xl font-bold text-blue-600 dark:text-blue-500">{scores.overall}</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Performance Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ScoreIndicator label="Reading" score={scores.reading} />
                            <ScoreIndicator label="Repetition" score={scores.repetition} />
                            <ScoreIndicator label="Comprehension" score={scores.comprehension} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Coach's Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {reportText}
                            </p>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
