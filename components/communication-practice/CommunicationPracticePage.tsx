'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/Card";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Mic, Play, CheckCircle, XCircle, ArrowRight, Volume2, Award, BookOpen, Repeat, Puzzle, Expand, MicOff, AlertTriangle, Send } from "lucide-react";

// --- UI Sub-components (No changes needed) ---
const WarningMessage = () => (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md flex items-center" role="alert">
        <AlertTriangle className="h-5 w-5 mr-3" />
        <div><p className="font-bold">Proctored Session Active</p><p>Please remain in full-screen mode. Exiting will immediately end the session.</p></div>
    </div>
);
const ProgressStepper = ({ currentStage }: { currentStage: string }) => {
    const stages = ["reading", "repetition", "comprehension", "finished", "summary"];
    const stageLabels: { [key: string]: string } = { reading: "Reading", repetition: "Repetition", comprehension: "Comprehension", finished: "Submit", summary: "Summary" };
    const currentIndex = stages.indexOf(currentStage);
    return (
        <div className="flex justify-center items-center space-x-2 md:space-x-4 mb-8">
            {stages.slice(0, 4).map((stage, index) => (
                <React.Fragment key={stage}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${index <= currentIndex ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                            {index < currentIndex ? <CheckCircle size={20} /> : index + 1}
                        </div>
                        <span className={`mt-2 text-xs font-medium capitalize ${index <= currentIndex ? "text-blue-600" : "text-slate-500"}`}>{stageLabels[stage]}</span>
                    </div>
                    {index < stages.length - 2 && <div className={`flex-1 h-1 mt-[-16px] ${index < currentIndex ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"} min-w-[20px] md:min-w-[50px]`}></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

// --- Type Definitions for Clarity ---
type AudioUploadResult = {
    originalText: string;
    audioUrl: string; // We now store the URL, not the Blob
};

type ComprehensionResult = {
    question: string;
    isCorrect: boolean;
};

function ReadingStage({ paragraphs, onComplete, user }: { paragraphs: string[], onComplete: (data: AudioUploadResult[]) => void, user: User }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [readingResults, setReadingResults] = useState<AudioUploadResult[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const supabase = createClientComponentClient();

    const handleUploadAndNext = async (audioBlob: Blob) => {
        setIsUploading(true);
        // The user's ID is used to create a secure folder for their uploads
        const filePath = `${user.id}/reading_${Date.now()}.webm`;
        
        try {
            const { error: uploadError } = await supabase.storage
                .from('audio-uploads')
                .upload(filePath, audioBlob);

            if (uploadError) throw uploadError;

            // Get the public URL of the uploaded file
            const { data } = supabase.storage
                .from('audio-uploads')
                .getPublicUrl(filePath);

            const newResult = { originalText: paragraphs[currentIndex], audioUrl: data.publicUrl };
            const newResults = [...readingResults, newResult];
            setReadingResults(newResults);

            if (currentIndex < paragraphs.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                onComplete(newResults);
            }
        } catch (error) {
            console.error("Error uploading audio:", error);
            alert("Failed to save your recording. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const startRecording = async () => {
        setIsRecording(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const audioChunks: Blob[] = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                stream.getTracks().forEach(track => track.stop());
                handleUploadAndNext(audioBlob);
            };
            mediaRecorderRef.current.start();
        } catch (err) {
            alert("Microphone permission is required to proceed.");
            setIsRecording(false);
        }
    };

    return (
        <Card className="max-w-3xl mx-auto text-center shadow-xl">
            <CardHeader><CardTitle>Stage 1: Reading Aloud ({currentIndex + 1}/{paragraphs.length})</CardTitle><CardDescription>Click Record, read the paragraph, then click Stop.</CardDescription></CardHeader>
            <CardContent>
                <p className="text-lg mb-8 p-6 bg-slate-100 dark:bg-slate-800 rounded-lg border">{paragraphs[currentIndex]}</p>
                <Button onClick={isRecording ? stopRecording : startRecording} disabled={isUploading} size="lg" variant={isRecording ? "destructive" : "default"}>
                    {isUploading ? <LoadingSpinner className="mr-2" /> : isRecording ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
                    {isUploading ? 'Saving...' : isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                {isRecording && <div className="text-red-500 mt-4 flex items-center justify-center animate-pulse font-semibold"><div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>Recording...</div>}
            </CardContent>
        </Card>
    );
}

function RepetitionStage({ tasks, onComplete, user }: { tasks: any[], onComplete: (data: AudioUploadResult[]) => void, user: User }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState<"idle" | "playing" | "ready_to_record" | "recording">("idle");
    const [isUploading, setIsUploading] = useState(false);
    const [repetitionResults, setRepetitionResults] = useState<AudioUploadResult[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const supabase = createClientComponentClient();

    const handleUploadAndNext = async (audioBlob: Blob) => {
        setIsUploading(true);
        const filePath = `${user.id}/repetition_${Date.now()}.webm`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('audio-uploads')
                .upload(filePath, audioBlob);
            
            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('audio-uploads')
                .getPublicUrl(filePath);

            const newResult = { originalText: tasks[currentIndex].text, audioUrl: data.publicUrl };
            const newResults = [...repetitionResults, newResult];
            setRepetitionResults(newResults);

            if (currentIndex < tasks.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setStatus("idle");
            } else {
                onComplete(newResults);
            }
        } catch (error) {
            console.error("Error uploading audio:", error);
            alert("Failed to save your recording. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleListen = () => {
        setStatus("playing");
        const audio = new Audio(tasks[currentIndex].audioUrl);
        audio.play().catch(err => setStatus("idle"));
        audio.onended = () => setStatus("ready_to_record");
    };

    const startRecording = async () => {
        setStatus("recording");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const audioChunks: Blob[] = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                stream.getTracks().forEach(track => track.stop());
                handleUploadAndNext(audioBlob);
            };
            mediaRecorderRef.current.start();
        } catch (err) {
            alert("Microphone permission is required.");
            setStatus("ready_to_record");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    }
    
    return (
        <Card className="max-w-3xl mx-auto text-center shadow-xl">
            <CardHeader><CardTitle>Stage 2: Listen & Repeat ({currentIndex + 1}/{tasks.length})</CardTitle><CardDescription>Listen to the phrase, then record your repetition.</CardDescription></CardHeader>
            <CardContent className="min-h-[150px] flex flex-col justify-center items-center">
                {status === "idle" && <Button size="lg" onClick={handleListen} disabled={isUploading}><Volume2 className="mr-2" /> Listen</Button>}
                {status === "playing" && <p className="text-blue-500 font-semibold animate-pulse">🔊 Playing audio...</p>}
                {status === "ready_to_record" && <Button size="lg" onClick={startRecording} disabled={isUploading}><Mic className="mr-2" /> Record Now</Button>}
                {status === "recording" && (<div className="flex flex-col items-center"><p className="text-red-500 font-semibold animate-pulse mb-4">🔴 Recording...</p><Button size="lg" variant="destructive" onClick={stopRecording}><MicOff className="mr-2" /> Stop Recording</Button></div>)}
                {isUploading && <div className="flex items-center mt-4"><LoadingSpinner /><p className="ml-2">Saving...</p></div>}
            </CardContent>
        </Card>
    );
}

function ComprehensionStage({ stories, onComplete }: { stories: any[], onComplete: (data: ComprehensionResult[]) => void }) {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [status, setStatus] = useState("idle");
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [comprehensionResults, setComprehensionResults] = useState<ComprehensionResult[]>([]);
    const currentStory = stories[currentStoryIndex];
    const currentQuestion = currentStory.questions[currentQuestionIndex];
    const handlePlayStory = () => {
        setStatus("playing");
        const audio = new Audio(currentStory.storyAudioUrl);
        audio.play().catch(() => setStatus("idle"));
        audio.onended = () => setStatus("answering");
    };
    const handleSelectAnswer = (option: string) => {
        if (selectedOption) return;
        setSelectedOption(option);
        const isCorrect = option === currentQuestion.correctAnswer;
        setTimeout(() => {
            const updatedResults = [...comprehensionResults, { question: currentQuestion.question, isCorrect }];
            setComprehensionResults(updatedResults);
            setSelectedOption(null);
            const isLastQuestionInStory = currentQuestionIndex === currentStory.questions.length - 1;
            const isLastStory = currentStoryIndex === stories.length - 1;
            if (isLastQuestionInStory) {
                if (isLastStory) onComplete(updatedResults);
                else {
                    setCurrentStoryIndex(prev => prev + 1);
                    setCurrentQuestionIndex(0);
                    setStatus("idle");
                }
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }, 1200);
    };
    return (
        <Card className="max-w-3xl mx-auto text-center shadow-xl">
            <CardHeader><CardTitle>Stage 3: Comprehension (Story {currentStoryIndex + 1}/{stories.length})</CardTitle><CardDescription>{status === "answering" ? `Question ${currentQuestionIndex + 1} of ${currentStory.questions.length}` : "Listen to the story, then answer the questions."}</CardDescription></CardHeader>
            <CardContent className="min-h-[250px] flex flex-col justify-center items-center">
                {status === "idle" && <Button size="lg" onClick={handlePlayStory}><Play className="mr-2" /> Play Story {currentStoryIndex + 1}</Button>}
                {status === "playing" && <p className="text-blue-500 font-semibold animate-pulse">🔊 Playing story...</p>}
                {status === "answering" && (<div className="w-full text-left"><h3 className="text-xl font-semibold mb-6 text-center">{currentQuestion.question}</h3><div className="space-y-3">{currentQuestion.options.map((option: string) => { const isSelected = selectedOption === option; const isCorrect = isSelected && option === currentQuestion.correctAnswer; return (<button key={option} onClick={() => handleSelectAnswer(option)} disabled={!!selectedOption} className={`w-full p-4 rounded-lg border-2 flex items-center justify-between transition-all duration-300 ${isCorrect ? "border-green-500 bg-green-100 dark:bg-green-900/50" : ""} ${isSelected && !isCorrect ? "border-red-500 bg-red-100 dark:bg-red-900/50" : ""} ${!isSelected ? "hover:border-blue-500 dark:hover:border-blue-400" : ""}`}><span className="font-medium">{option}</span>{isSelected && (isCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />)}</button>); })}</div></div>)}
            </CardContent>
        </Card>
    );
}
function SubmitStage({ onSubmit, isSubmitting }: { onSubmit: () => void; isSubmitting: boolean; }) {
    return (
        <Card className="max-w-3xl mx-auto text-center shadow-xl">
            <CardHeader><CardTitle>All Stages Complete!</CardTitle><CardDescription>You have completed all the exercises. Click the button below to submit your session for analysis.</CardDescription></CardHeader>
            <CardContent className="py-12 flex flex-col items-center">
                <Button size="lg" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? (<><LoadingSpinner className="mr-2 h-5 w-5" /> Submitting...</>) : (<><Send className="mr-2 h-5 w-5" /> Submit for Analysis</>)}</Button>
                {isSubmitting && <p className="text-sm text-slate-500 mt-4">Please wait, preparing your results...</p>}
            </CardContent>
        </Card>
    );
}
function ResultsDisplayStage({ analysis, onComplete }: { analysis: any, onComplete: () => void }) {
    if (!analysis || !analysis.scores) {
        return <Card className="max-w-3xl mx-auto text-center"><CardContent className="py-12"><p>Could not load analysis results.</p></CardContent></Card>;
    }
    const readingScore = Math.round(analysis.scores.reading);
    const repetitionScore = Math.round(analysis.scores.repetition);
    const comprehensionScore = Math.round(analysis.scores.comprehension);
    const overallScore = Math.round((readingScore + repetitionScore + comprehensionScore) / 3);
    return (
        <Card className="max-w-3xl mx-auto text-center">
            <CardHeader><Award className="mx-auto h-12 w-12 text-yellow-500" /><CardTitle className="mt-4">Practice Complete!</CardTitle><CardDescription>Here is your performance summary.</CardDescription></CardHeader>
            <CardContent>
                <p className="text-6xl font-bold text-blue-500">{overallScore}<span className="text-3xl text-slate-400">/100</span></p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Reading</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{readingScore}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Repetition</CardTitle><Repeat className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{repetitionScore}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Comprehension</CardTitle><Puzzle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{comprehensionScore}</div></CardContent></Card>
                </div>
                <Button size="lg" onClick={onComplete} className="mt-8">View Detailed Report <ArrowRight className="ml-2" /></Button>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---
export default function CommunicationPracticePage() {
    const [results, setResults] = useState<{ reading: AudioUploadResult[], repetition: AudioUploadResult[], comprehension: ComprehensionResult[] }>({ reading: [], repetition: [], comprehension: [] });
    const [stage, setStage] = useState<"ready" | "loading" | "reading" | "repetition" | "comprehension" | "finished" | "summary">("ready");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [practiceSet, setPracticeSet] = useState<any>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [finalAnalysis, setFinalAnalysis] = useState<any>(null);
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUser(user);
            else router.push('/login');
        };
        fetchUser();
    }, [supabase, router]);

    useEffect(() => {
        if (stage === "loading") {
            const fetchPracticeSet = async () => {
                try {
                    const response = await fetch("/communication-practice.json");
                    const data = await response.json();
                    const randomIndex = Math.floor(Math.random() * data.sets.length);
                    setPracticeSet(data.sets[randomIndex]);
                    setStage("reading");
                } catch (error) {
                    console.error("Failed to load practice set:", error);
                    router.push("/dashboard");
                }
            };
            fetchPracticeSet();
        }
    }, [stage, router]);

    const handleStageComplete = (stageName: 'reading' | 'repetition' | 'comprehension', data: any[]) => {
        setResults(prev => ({ ...prev, [stageName]: data }));
        if (stageName === "reading") setStage("repetition");
        if (stageName === "repetition") setStage("comprehension");
        if (stageName === "comprehension") setStage("finished");
    };

    const handleSubmitForAnalysis = async () => {
        if (isSubmitting || !user) return;
        setIsSubmitting(true);

        const finalPayload = {
            readingResults: results.reading,
            repetitionResults: results.repetition,
            comprehensionResults: results.comprehension,
        };

        try {
            const response = await fetch('/api/analyze', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload) 
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Analysis failed.");
            }
            
            const { sessionId, analysis } = await response.json();
            setSessionId(sessionId);
            setFinalAnalysis(analysis);
            setStage('summary');

        } catch (err: any) {
            console.error("Error submitting for analysis:", err);
            alert(`An error occurred: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleViewReport = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        router.push(`/feedback/${sessionId}`);
    };
    
    const handleStartSession = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            await document.documentElement.requestFullscreen();
            setStage("loading");
        } catch (err) {
            console.error("Failed to get permissions or enter fullscreen:", err);
            alert("Microphone access is required to start the session. Please allow access and try again.");
        }
    };
    
    if (!user) {
        return <div className="flex h-screen items-center justify-center"><LoadingSpinner /><p className="ml-4 text-lg">Loading session...</p></div>;
    }

    return (
        <div className="container mx-auto py-8">
            {["reading", "repetition", "comprehension", "finished"].includes(stage) && <WarningMessage />}
            <h1 className="text-center text-4xl font-bold mb-2">Communication Coach</h1>
            {practiceSet && <p className="text-center text-lg text-slate-500 mb-8">Practice Set: "{practiceSet.setName}"</p>}
            
            {stage !== 'ready' && <ProgressStepper currentStage={stage} />}

            <div className="mt-8">
                {stage === "ready" && (
                    <div className="flex flex-col h-[70vh] items-center justify-center text-center p-4">
                        <Card className="max-w-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-3xl">Communication Coach</CardTitle>
                                <CardDescription className="text-lg pt-2 text-slate-600 dark:text-slate-400">
                                    This is a proctored practice session. We'll ask for microphone access, then the window will enter full-screen mode.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button size="lg" onClick={handleStartSession}>
                                    <Expand className="mr-2 h-5 w-5" /> Start Focused Session
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {stage === "reading" && practiceSet && <ReadingStage paragraphs={practiceSet.reading} onComplete={(data) => handleStageComplete("reading", data)} user={user} />}
                {stage === "repetition" && practiceSet && <RepetitionStage tasks={practiceSet.repetition} onComplete={(data) => handleStageComplete("repetition", data)} user={user} />}
                {stage === "comprehension" && practiceSet && <ComprehensionStage stories={practiceSet.comprehension} onComplete={(data) => handleStageComplete("comprehension", data)} />}
                
                {stage === 'finished' && <SubmitStage onSubmit={handleSubmitForAnalysis} isSubmitting={isSubmitting} />}
                {stage === 'summary' && finalAnalysis && <ResultsDisplayStage analysis={finalAnalysis} onComplete={handleViewReport} />}
            </div>
        </div>
    );
}
