import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/common/Card"; // Adjusted path
import { Progress } from "@/components/common/Progress"; // Adjusted path

/**
 * A utility to get color styles based on a score.
 */
const getScoreStyle = (score: number) => {
    if (score >= 90) return { text: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/50', progress: 'bg-green-500' };
    if (score >= 70) return { text: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/50', progress: 'bg-yellow-500' };
    return { text: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/50', progress: 'bg-red-500' };
};

/**
 * Defines the props for the enhanced StatCard component.
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  // Score is optional. If provided, a progress bar and colored value will be shown.
  score?: number | null;
}

/**
 * An enhanced, visually appealing card for displaying key statistics.
 * It includes a styled icon, a clear value, a description, and an optional progress bar.
 */
const StatCard = ({ title, value, icon, description, score }: StatCardProps) => {
  const scoreStyle = score != null ? getScoreStyle(score) : null;

  return (
    <Card className="shadow-md hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-slate-100/50 dark:bg-slate-800/50 transition-transform duration-500 group-hover:scale-150" />

        <CardHeader className="pb-4 z-10 relative">
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="text-base font-semibold text-slate-700 dark:text-slate-300">{title}</CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
                </div>
                <div className={`p-3 rounded-full ${scoreStyle ? scoreStyle.bg : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <div className={`h-6 w-6 ${scoreStyle ? scoreStyle.text : 'text-slate-500'}`}>
                        {icon}
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="z-10 relative">
            <div 
              className={`text-4xl font-bold ${scoreStyle ? scoreStyle.text : 'text-slate-900 dark:text-slate-50'}`}
            >
              {value}
            </div>
        </CardContent>
        {score != null && (
            <CardFooter className="pt-2 z-10 relative">
                <Progress value={score} className="h-2" indicatorClassName={scoreStyle?.progress} />
            </CardFooter>
        )}
    </Card>
  );
};

export default StatCard;