// components/communication-practice/CommunicationPracticePage.tsx

'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { addSessionToHistory, getSessionResult } from "@/lib/userActions";
import type { Session } from "@/lib/types";
import Button from "@/components/common/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/Card";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Mic, Play, CheckCircle, XCircle, ArrowRight, Volume2, Award, BookOpen, Repeat, Puzzle, Expand, MicOff, AlertTriangle } from "lucide-react";

// --- UI Components (some are placeholders for brevity) ---

const WarningMessage = () => (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md flex items-center" role="alert">
    <AlertTriangle className="h-5 w-5 mr-3" />
    <div>
      <p className="font-bold">Proctored Session Active</p>
      <p>Please remain in full-screen mode. Exiting will immediately end the session.</p>
    </div>
  </div>
);

const ProgressStepper = ({ currentStage }: { currentStage: string }) => { /* ... existing code ... */ return <div></div>; };
const ReadingStage = ({ onComplete }: { onComplete: (data: any[]) => void }) => { /* ... existing code ... */ return <button onClick={() => onComplete([])}>Finish Reading</button>; };
const RepetitionStage = ({ onComplete }: { onComplete: (data: any[]) => void }) => { /* ... existing code ... */ return <button onClick={() => onComplete([])}>Finish Repetition</button>; };
const ComprehensionStage = ({ onComplete }: { onComplete: (data: any[]) => void }) => { /* ... existing code ... */ return <button onClick={() => onComplete([])}>Finish Comprehension</button>; };


// --- NEW: Polling Component ---
// This component waits for the background worker to finish.
function AnalysisPollingStage({ sessionId, onAnalysisComplete }: { sessionId: string, onAnalysisComplete: (analysis: any) => void }) {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                // This new function checks the database for the result.
                const sessionResult = await getSessionResult(sessionId);
                
                // If the session has feedback, it means the worker is done.
                if (sessionResult?.feedback) {
                    clearInterval(interval);
                    onAnalysisComplete(sessionResult.feedback);
                }
            } catch (err) {
                clearInterval(interval);
                setError("Failed to retrieve analysis results. Please check your dashboard later.");
                console.error(err);
            }
        }, 5000); // Check every 5 seconds

        // Cleanup function to stop polling when the component unmounts
        return () => clearInterval(interval);
    }, [sessionId, onAnalysisComplete]);

    if (error) {
        return (
            <Card className="max-w-3xl mx-auto text-center">
                <CardHeader><CardTitle className="text-red-500">Error</CardTitle></CardHeader>
                <CardContent><p className="text-red-500">{error}</p></CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-3xl mx-auto text-center">
            <CardContent className="py-12 flex flex-col items-center">
                <LoadingSpinner />
                <p className="mt-4 font-semibold text-lg">Analyzing your session...</p>
                <p className="text-sm text-slate-500">This may take a moment. We'll show your results here as soon as they're ready.</p>
            </CardContent>
        </Card>
    );
}


// --- NEW: Results Display Component ---
// This component only displays the final results.
function ResultsDisplayStage({ analysis, onComplete }: { analysis: any, onComplete: () => void }) {
    if (!analysis || !analysis.scores) {
        // This check prevents the "cannot read properties of undefined" error.
        return <Card className="max-w-3xl mx-auto text-center"><CardContent className="py-12"><p>Could not load analysis results.</p></CardContent></Card>;
    }

    return (
        <Card className="max-w-3xl mx-auto text-center">
            <CardHeader>
                <Award className="mx-auto h-12 w-12 text-yellow-500" />
                <CardTitle className="mt-4">Practice Complete!</CardTitle>
                <CardDescription>Here is your performance summary.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-6xl font-bold text-blue-500">{analysis.scores.overall}<span className="text-3xl text-slate-400">/100</span></p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Reading</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{analysis.scores.reading}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Repetition</CardTitle><Repeat className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{analysis.scores.repetition}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Comprehension</CardTitle><Puzzle className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{analysis.scores.comprehension}</div></CardContent>
                    </Card>
                </div>
                <Button size="lg" onClick={onComplete} className="mt-8">View Detailed Report <ArrowRight className="ml-2" /></Button>
            </CardContent>
        </Card>
    );
}


// --- Main Page Component (Refactored) ---
export default function CommunicationPracticePage() {
    const [stage, setStage] = useState("ready"); // ready, loading, reading, repetition, comprehension, polling, summary
    const [results, setResults] = useState<{ reading: any[], repetition: any[], comprehension: any[] }>({ reading: [], repetition: [], comprehension: [] });
    const [practiceSet, setPracticeSet] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
    const router = useRouter();

    // --- Data Fetching & Stage Logic (largely unchanged) ---
    useEffect(() => {
        if (stage === "loading") {
            // ... existing fetchPracticeSet logic
        }
    }, [stage, router]);

    const handleStartSession = () => {
        document.documentElement.requestFullscreen().catch(err => console.error(`Fullscreen error: ${err.message}`));
        setStage("loading");
    };
    
    const handleStageComplete = (stageName: string, data: any[]) => {
        const newResults = { ...results, [stageName]: data };
        setResults(newResults);

        if (stageName === "reading") setStage("repetition");
        else if (stageName === "repetition") setStage("comprehension");
        else if (stageName === "comprehension") {
            // Instead of going to scoreSummary, we now start the analysis job
            startAnalysisJob(newResults);
        }
    };

    // --- NEW: Function to start the background job ---
    const startAnalysisJob = async (allResults: any) => {
        try {
            const formData = new FormData();
            formData.append('results', JSON.stringify(allResults));
            allResults.reading.forEach((r: any, i: number) => formData.append(`reading_audio_${i}`, r.audioBlob));
            allResults.repetition.forEach((r: any, i: number) => formData.append(`repetition_audio_${i}`, r.audioBlob));

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            if (response.status !== 202) {
                throw new Error("Failed to start analysis job.");
            }

            // The API now returns a jobId, which we'll use as our session ID
            const { jobId } = await response.json();
            setSessionId(jobId);
            setStage('polling'); // Move to the new polling stage

        } catch (err: any) {
            console.error(err);
            // TODO: Add UI to show an error state
        }
    };

    const handleAnalysisComplete = (analysis: any) => {
        setFinalAnalysis(analysis);
        setStage('summary'); // Move to the final summary display
    };
    
    const handleViewReport = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        router.push(`/feedback/${sessionId}`);
    };

    // --- Render Logic ---
    if (stage === "ready") {
        return (
            <div className="flex flex-col h-[70vh] items-center justify-center text-center p-4">
                <Card className="max-w-xl shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl">Communication Coach</CardTitle>
                        <CardDescription className="text-lg pt-2 text-slate-600 dark:text-slate-400">
                            This is a proctored practice session. The window will enter full-screen mode. Please remain in full-screen until the session is complete.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button size="lg" onClick={handleStartSession}>
                            <Expand className="mr-2 h-5 w-5" /> Start Focused Session
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (stage === 'polling') {
        return <AnalysisPollingStage sessionId={sessionId!} onAnalysisComplete={handleAnalysisComplete} />;
    }

    if (stage === 'summary') {
        return <ResultsDisplayStage analysis={finalAnalysis} onComplete={handleViewReport} />;
    }

    // Render the main practice UI
    return (
        <div className="container mx-auto py-8">
            {/* ... Your existing practice UI (WarningMessage, ProgressStepper, etc.) ... */}
            {stage === "reading" && <ReadingStage onComplete={(data) => handleStageComplete("reading", data)} />}
            {stage === "repetition" && <RepetitionStage onComplete={(data) => handleStageComplete("repetition", data)} />}
            {stage === "comprehension" && <ComprehensionStage onComplete={(data) => handleStageComplete("comprehension", data)} />}
        </div>
    );
}
