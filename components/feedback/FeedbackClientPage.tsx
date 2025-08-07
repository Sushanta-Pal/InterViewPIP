'use client';

import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import  Button  from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { ArrowLeft, BookOpen, Repeat, BrainCircuit, Star, BarChart2 } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import type { Session } from '@/lib/types';

// --- Helper Functions & Components ---

/**
 * Determines the color style based on the score for consistent visual feedback.
 */
const getScoreStyle = (score: number | null | undefined) => {
    if (score === null || score === undefined) return { text: 'text-slate-500', path: '#64748b', trail: '#e2e8f0' };
    if (score >= 85) return { text: 'text-green-500', path: '#22c55e', trail: '#dcfce7' };
    if (score >= 60) return { text: 'text-yellow-500', path: '#f59e0b', trail: '#fef3c7' };
    return { text: 'text-red-500', path: '#ef4444', trail: '#fee2e2' };
};

/**
 * A redesigned card for the score breakdown, with a cleaner look.
 */
const ScoreBreakdownCard = ({ title, score, icon }: { title: string, score: number, icon: React.ReactNode }) => {
    const scoreStyle = getScoreStyle(score);

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-6 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${scoreStyle.path} bg-opacity-10`}>
                    <div className={`h-6 w-6 ${scoreStyle.text}`}>{icon}</div>
                </div>
                <div className="flex-grow">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <p className={`text-2xl font-bold ${scoreStyle.text}`}>
                        {score}<span className="text-lg text-slate-400">/100</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};


// --- Main Feedback Page Component ---

export default function FeedbackClientPage({ session }: { session: Session }) {
    const router = useRouter();
    const { scores, reportText } = session.feedback;

    const overallScoreStyle = getScoreStyle(scores.overall);
    const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 },
        },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 },
        },
    };

    return (
        <motion.div 
            className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* --- Header --- */}
            <motion.div variants={itemVariants} className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white">Session Report</CardTitle>
                    <CardDescription className="text-md text-slate-500">{formattedDate}</CardDescription>
                </div>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </motion.div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* --- Left Column: Score Summary --- */}
                <motion.div variants={containerVariants} className="lg:col-span-1 space-y-6 sticky top-8">
                    <motion.div variants={itemVariants}>
                        <Card className="shadow-lg text-center">
                            <CardHeader>
                                <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Overall Score</p>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                                <div style={{ width: 180, height: 180 }}>
                                    <CircularProgressbar
                                        value={scores.overall}
                                        text={`${scores.overall}`}
                                        styles={buildStyles({
                                            textSize: '24px',
                                            pathColor: overallScoreStyle.path,
                                            textColor: overallScoreStyle.path,
                                            trailColor: overallScoreStyle.trail,
                                            pathTransitionDuration: 0.8
                                        })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <BarChart2 className="h-5 w-5" />
                                    Score Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ScoreBreakdownCard title="Reading" score={scores.reading} icon={<BookOpen />} />
                                <ScoreBreakdownCard title="Repetition" score={scores.repetition} icon={<Repeat />} />
                                <ScoreBreakdownCard title="Comprehension" score={scores.comprehension} icon={<BrainCircuit />} />
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* --- Right Column: Detailed Feedback --- */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-3">
                                <Star className="text-yellow-400" />
                                Detailed AI Feedback
                            </CardTitle>
                            <CardDescription>
                                Here's a summary of your performance with actionable advice.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                // This applies beautiful markdown styling
                                className="prose prose-slate dark:prose-invert max-w-none 
                                           prose-headings:font-semibold prose-h2:text-xl prose-h2:border-b prose-h2:pb-2
                                           prose-p:leading-relaxed prose-a:text-blue-500 prose-ul:list-disc prose-ul:pl-6 prose-li:my-1"
                                dangerouslySetInnerHTML={{ __html: reportText }}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

            </div>
        </motion.div>
    );
}