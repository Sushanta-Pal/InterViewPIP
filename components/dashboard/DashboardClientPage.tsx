"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, Variants } from "framer-motion"
import { Button } from "@/components/common/Button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/common/Card"
import { Progress } from "@/components/common/Progress"
import {
    PlusCircle,
    TrendingUp,
    Target,
    BookOpen,
    Repeat,
    History,
    Puzzle,
    ChevronRight,
    ClipboardList,
} from "lucide-react"
// 1. Import the correct types from your types file
import type { DashboardData, Session } from "@/lib/types"

// --- Helper Functions & Components (Your original code, no changes needed here) ---

const getScoreStyle = (score: number) => {
    if (score >= 90) return { text: 'text-green-500', bg: 'bg-green-500', progress: 'bg-green-500' };
    if (score >= 70) return { text: 'text-yellow-500', bg: 'bg-yellow-500', progress: 'bg-yellow-500' };
    return { text: 'text-red-500', bg: 'bg-red-500', progress: 'bg-red-500' };
};

const StatCard = ({ title, value, icon, description, score }: { title: string; value: number | string; icon: React.ReactNode; description: string; score?: number }) => {
    const scoreStyle = score !== undefined ? getScoreStyle(score) : null;
    return (
        <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className="text-slate-400">{icon}</div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </CardContent>
            {score !== undefined && score !== null && (
                 <CardFooter>
                    <Progress value={score} className="h-2" indicatorClassName={scoreStyle?.progress} />
                 </CardFooter>
            )}
        </Card>
    );
};

// --- Main Dashboard Component ---

// 2. Change the prop from 'profile' to 'initialData' and update its type
export default function DashboardClientPage({ initialData }: { initialData: DashboardData }) {
    const router = useRouter();

    const handleSessionClick = (sessionId: string) => {
        router.push(`/feedback/${sessionId}`);
    };

    // 3. Update variables to use the new 'initialData' prop
    const overallScore = Math.round(initialData.overall_average ?? 0);
    const totalSessions = initialData.sessions_completed ?? 0;
    const sortedHistory = initialData.session_history ? [...initialData.session_history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
            },
        },
    };

    return (
        <motion.div
            className="space-y-8 p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 min-h-screen"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* --- Header Section --- */}
            <motion.div variants={itemVariants} className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                        {/* Updated Greeting */}
                        Welcome Back!
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
                        Here's your performance summary. Ready to improve?
                    </p>
                </div>
                <Link href="/communication-practice" passHref>
                    <Button size="lg" className="relative overflow-hidden group">
                        <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white rounded-full group-hover:w-32 group-hover:h-32 opacity-10"></span>
                        <PlusCircle className="mr-2 h-5 w-5" /> Start New Session
                    </Button>
                </Link>
            </motion.div>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- Left Column: Stats (Updated with new data fields) --- */}
                <motion.div variants={containerVariants} className="lg:col-span-1 space-y-6">
                    <motion.h2 variants={itemVariants} className="text-2xl font-semibold text-slate-800 dark:text-slate-200">At a Glance</motion.h2>
                     <motion.div variants={itemVariants}>
                        <StatCard
                            title="Overall Average"
                            value={overallScore}
                            score={overallScore}
                            icon={<TrendingUp className="h-5 w-5" />}
                            description="Across all sessions"
                        />
                     </motion.div>
                     <motion.div variants={itemVariants}>
                        <StatCard
                            title="Sessions Completed"
                            value={totalSessions}
                            icon={<Target className="h-5 w-5" />}
                            description="Keep up the great work!"
                        />
                     </motion.div>
                     <motion.div variants={itemVariants}>
                        <StatCard
                            title="Avg. Reading"
                            value={Math.round(initialData.avg_reading ?? 0)}
                            score={initialData.avg_reading}
                            icon={<BookOpen className="h-5 w-5" />}
                            description="Clarity and pronunciation"
                        />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <StatCard
                            title="Avg. Repetition"
                            value={Math.round(initialData.avg_repetition ?? 0)}
                            score={initialData.avg_repetition}
                            icon={<Repeat className="h-5 w-5" />}
                            description="Listening and recall"
                        />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <StatCard
                            title="Avg. Comprehension"
                            value={Math.round(initialData.avg_comprehension ?? 0)}
                            score={initialData.avg_comprehension}
                            icon={<Puzzle className="h-5 w-5" />}
                            description="Understanding and analysis"
                        />
                    </motion.div>
                </motion.div>

                {/* --- Right Column: Session History (Updated to use sortedHistory from new data) --- */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="shadow-lg h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center text-2xl">
                                <History className="mr-3 h-7 w-7" /> Session History
                            </CardTitle>
                            <CardDescription>
                                Review your past practice sessions and detailed feedback reports.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sortedHistory.length > 0 ? (
                                <motion.div variants={containerVariants} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                    {sortedHistory.map((session: Session) => { // Added Session type
                                        const scoreStyle = getScoreStyle(session.score);
                                        return (
                                            <motion.div
                                                key={session.id}
                                                variants={itemVariants}
                                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                                onClick={() => handleSessionClick(session.id)}
                                            >
                                                <Card className="group p-4 flex items-center gap-4 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-all duration-300">
                                                    <div className={`w-3 h-3 rounded-full ${scoreStyle.bg}`}></div>
                                                    <div className="flex-grow">
                                                        <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">{session.type} Practice</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                    </div>
                                                    <div className="text-right flex items-center gap-4">
                                                        <p className={`font-bold text-2xl ${scoreStyle.text}`}>
                                                            {session.score}
                                                            <span className="text-base text-slate-400">/100</span>
                                                        </p>
                                                        <ChevronRight className="h-6 w-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <div className="text-center py-16 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <ClipboardList className="mx-auto h-12 w-12 text-slate-400" />
                                    <h3 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-300">No Sessions Yet</h3>
                                    <p className="text-slate-500 mt-2">Click "Start New Session" to begin your first practice.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}