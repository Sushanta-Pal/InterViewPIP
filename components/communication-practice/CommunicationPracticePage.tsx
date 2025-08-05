'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { addSessionToHistory } from "@/lib/userActions";
import type { Session } from "@/lib/userActions";

// Import UI Components & Icons from your project
import Button from "@/components/common/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/common/Card";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Mic, Play, CheckCircle, XCircle, ArrowRight, Volume2, Award, BookOpen, Repeat, BrainCircuit, Expand } from "lucide-react";

// --- Helper Function for AI Analysis ---
// In a real application, this would be an API call to your backend.
// For now, it's a mock function that simulates the analysis process.
async function analyzeCommunicationSession(results: any) {
    console.log("Sending results for analysis:", results);
    // Simulate network delay for API call
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock scoring logic
    const readingScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const repetitionScore = Math.floor(Math.random() * 30) + 65; // 65-95
    const comprehensionCorrect = results.comprehension.filter((r: any) => r.isCorrect).length;
    const comprehensionTotal = results.comprehension.length;
    const comprehensionScore = comprehensionTotal > 0 ? Math.round((comprehensionCorrect / comprehensionTotal) * 100) : 100;
    
    const overallScore = Math.round((readingScore + repetitionScore + comprehensionScore) / 3);

    const reportText = `
        <h2 style="font-size: 1.5em; font-weight: bold; margin-bottom: 1rem;">Communication Skills Analysis Report</h2>
        <p style="margin-bottom: 1rem;">This report summarizes your performance across reading, repetition, and comprehension exercises.</p>
        <h3 style="font-size: 1.25em; font-weight: bold; margin-bottom: 0.5rem;">Overall Summary</h3>
        <p style="margin-bottom: 1.5rem;">Your overall communication score is <strong>${overallScore} out of 100</strong>. You demonstrated excellent comprehension and solid repetition skills.</p>
        <h3 style="font-size: 1.25em; font-weight: bold; margin-bottom: 0.5rem;">Reading Clarity</h3>
        <p style="margin-bottom: 1.5rem;">Your reading accuracy score is <strong>${readingScore}%</strong>. Your pacing was consistent and clear.</p>
        <h3 style="font-size: 1.25em; font-weight: bold; margin-bottom: 0.5rem;">Repetition Accuracy</h3>
        <p style="margin-bottom: 1.5rem;">Your repetition accuracy score is <strong>${repetitionScore}%</strong>. This is a strong result, showing good active listening.</p>
        <h3 style="font-size: 1.25em; font-weight: bold; margin-bottom: 0.5rem;">Listening Comprehension</h3>
        <p style="margin-bottom: 1.5rem;">Your listening comprehension score is an impressive <strong>${comprehensionScore}%</strong>. Keep up the great work in this area.</p>
    `;

    return {
        scores: {
            overall: overallScore,
            reading: readingScore,
            repetition: repetitionScore,
            comprehension: comprehensionScore,
        },
        reportText: reportText,
    };
}


// --- Main Page Component ---
export default function CommunicationPracticePage() {
  const [stage, setStage] = useState("ready");
  const [results, setResults] = useState({ reading: [], repetition: [], comprehension: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [practiceSet, setPracticeSet] = useState<any>(null);
  
  const router = useRouter();
  const { userId } = useAuth();

  // Fetch practice questions when the session starts
  useEffect(() => {
    if (stage === "loading") {
      const fetchPracticeSet = async () => {
        try {
          const response = await fetch("/communication-practice.json");
          if (!response.ok) throw new Error("Network response was not ok");
          const data = await response.json();
          const randomIndex = Math.floor(Math.random() * data.sets.length);
          setPracticeSet(data.sets[randomIndex]);
          setStage("reading");
        } catch (error) {
          console.error("Failed to load practice set:", error);
          alert("Could not load the practice set. Please try again.");
          router.push("/dashboard");
        } finally {
          setIsLoading(false);
        }
      };
      fetchPracticeSet();
    }
  }, [stage, router]);

  const handleStartSession = () => {
    setIsLoading(true);
    setStage("loading");
  };

  const handleStageComplete = (stageName: string, data: any[]) => {
    const newResults = { ...results, [stageName]: data };
    setResults(newResults);

    if (stageName === "reading") setStage("repetition");
    else if (stageName === "repetition") setStage("comprehension");
    else if (stageName === "comprehension") setStage("scoreSummary");
  };

  const handleSummaryComplete = async (analysis: any) => {
    if (!userId) {
        alert("You must be logged in to save a session.");
        return;
    }
    const sessionId = Date.now().toString();
    const sessionData: Session = {
      id: sessionId,
      type: "Communication",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      score: analysis.scores.overall,
      feedback: analysis,
    };
    
    await addSessionToHistory(userId, sessionData);
    router.push(`/feedback/${sessionId}`);
  };

  // --- Render Logic ---

  if (stage === "ready") {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center text-center p-4">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Communication Coach</CardTitle>
            <CardDescription className="text-lg pt-2">
              You are about to begin a multi-stage practice session to test your communication skills.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={handleStartSession}>
              <Play className="mr-2 h-5 w-5" /> Start Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || (stage !== "results" && !practiceSet)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
        <p className="ml-4 text-lg">Preparing your exercises...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-center text-4xl font-bold tracking-tight mb-2">
        Communication Coach
      </h1>
      <p className="text-center text-lg text-slate-500 mb-8">
        Practice Set: "{practiceSet.setName}"
      </p>
      <ProgressStepper currentStage={stage} />

      <div className="mt-8">
        {stage === "reading" && <ReadingStage paragraphs={practiceSet.reading} onComplete={(data) => handleStageComplete("reading", data)} />}
        {stage === "repetition" && <RepetitionStage tasks={practiceSet.repetition} onComplete={(data) => handleStageComplete("repetition", data)} />}
        {stage === "comprehension" && <ComprehensionStage stories={practiceSet.comprehension} onComplete={(data) => handleStageComplete("comprehension", data)} />}
        {stage === "scoreSummary" && <ScoreSummaryStage allResults={results} onComplete={handleSummaryComplete} />}
      </div>
    </div>
  );
}

// --- Stage 1: Reading Aloud ---
function ReadingStage({ paragraphs, onComplete }: { paragraphs: string[], onComplete: (data: any[]) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState("idle");
  const [readingResults, setReadingResults] = useState<any[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = () => {
    if (currentIndex < paragraphs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setStatus("idle");
    } else {
      onComplete(readingResults);
    }
  };

  const stopRecording = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    setStatus("recording");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        if (audioBlob.size > 0) {
            const newResult = { originalText: paragraphs[currentIndex], audioBlob };
            setReadingResults(prev => [...prev, newResult]);
        }
        handleNext();
      };
      mediaRecorderRef.current.start();
      timeoutRef.current = setTimeout(stopRecording, 7000); // Record for 7 seconds
    } catch (err) {
      alert("Microphone permission is required for this exercise.");
      setStatus("idle");
    }
  };

  return (
    <Card className="max-w-3xl mx-auto text-center">
      <CardHeader>
        <CardTitle>Stage 1: Reading Aloud ({currentIndex + 1}/{paragraphs.length})</CardTitle>
        <CardDescription>Read the paragraph below. The recording will stop automatically after 7 seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-md">{paragraphs[currentIndex]}</p>
        {status === "recording" && <div className="text-red-500 mb-4 animate-pulse font-semibold">🔴 Recording...</div>}
        <Button onClick={status === "recording" ? stopRecording : startRecording} size="lg">
          {status === "recording" ? "Recording..." : <><Mic className="mr-2" /> Start Recording</>}
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Stage 2: Listen & Repeat ---
function RepetitionStage({ tasks, onComplete }: { tasks: any[], onComplete: (data: any[]) => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [status, setStatus] = useState("idle");
    const [repetitionResults, setRepetitionResults] = useState<any[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleNext = () => {
        if (currentIndex < tasks.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setStatus("idle");
        } else {
            onComplete(repetitionResults);
        }
    };

    const handleListen = () => {
        setStatus("playing");
        const audio = new Audio(tasks[currentIndex].audioUrl);
        audio.play().catch(err => {
            console.error("Error playing audio:", err);
            setStatus("idle");
        });
        audio.onended = () => setStatus("ready_to_record");
    };

    const stopRecording = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const startRecording = async () => {
        setStatus("recording");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];
            mediaRecorderRef.current.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                stream.getTracks().forEach(track => track.stop());
                if (audioBlob.size > 0) {
                    const newResult = { originalText: tasks[currentIndex].text, audioBlob };
                    setRepetitionResults(prev => [...prev, newResult]);
                }
                handleNext();
            };
            mediaRecorderRef.current.start();
            timeoutRef.current = setTimeout(stopRecording, 10000);
        } catch (err) {
            alert("Microphone permission is required.");
            setStatus("ready_to_record");
        }
    };

    return (
        <Card className="max-w-3xl mx-auto text-center">
            <CardHeader>
                <CardTitle>Stage 2: Listen & Repeat ({currentIndex + 1}/{tasks.length})</CardTitle>
                <CardDescription>Listen to the phrase, then record your repetition.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[150px] flex flex-col justify-center items-center">
                {status === "idle" && <Button size="lg" onClick={handleListen}><Volume2 className="mr-2" /> Listen</Button>}
                {status === "playing" && <p className="text-blue-500 font-semibold animate-pulse">🔊 Playing audio...</p>}
                {(status === "ready_to_record" || status === "recording") && (
                    <Button onClick={status === "recording" ? stopRecording : startRecording} variant={status === "recording" ? "destructive" : "default"} size="lg">
                        {status === "recording" ? "Stop Recording" : <><Mic className="mr-2" /> Record Now</>}
                    </Button>
                )}
                {status === "recording" && <div className="mt-4 text-red-500 font-semibold animate-pulse">Recording...</div>}
            </CardContent>
        </Card>
    );
}

// --- Stage 3: Story Comprehension ---
function ComprehensionStage({ stories, onComplete }: { stories: any[], onComplete: (data: any[]) => void }) {
    const [status, setStatus] = useState("idle");
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [comprehensionResults, setComprehensionResults] = useState<any[]>([]);

    const currentStory = stories[currentStoryIndex];
    const currentQuestion = currentStory.questions[currentQuestionIndex];

    const handlePlayStory = () => {
        setStatus("playing");
        const audio = new Audio(currentStory.storyAudioUrl);
        audio.play().catch(err => {
            console.error("Error playing audio:", err);
            setStatus("idle");
        });
        audio.onended = () => {
            setStatus("answering");
        };
    };

    const handleSelectAnswer = (option: string) => {
        if (selectedOption) return;
        setSelectedOption(option);
        const isCorrect = option === currentQuestion.correctAnswer;
        const newResult = { question: currentQuestion.question, selected: option, isCorrect };

        setTimeout(() => {
            const updatedResults = [...comprehensionResults, newResult];
            setComprehensionResults(updatedResults);
            setSelectedOption(null);

            const isLastQuestion = currentQuestionIndex === currentStory.questions.length - 1;
            if (isLastQuestion) {
                onComplete(updatedResults);
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
            }
        }, 1000);
    };

    return (
        <Card className="max-w-3xl mx-auto text-center">
            <CardHeader>
                <CardTitle>Stage 3: Listening Comprehension</CardTitle>
                <CardDescription>{status === "answering" ? `Question ${currentQuestionIndex + 1}` : "Listen to the story, then answer the questions."}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[250px] flex flex-col justify-center items-center">
                {status === "idle" && <Button size="lg" onClick={handlePlayStory}><Play className="mr-2" /> Play Story</Button>}
                {status === "playing" && <p className="text-blue-500 font-semibold animate-pulse">🔊 Story is playing...</p>}
                {status === "answering" && (
                    <div className="w-full text-left">
                        <h3 className="text-xl font-semibold mb-4 text-center">{currentQuestion.question}</h3>
                        <div className="space-y-3">
                            {currentQuestion.options.map((option: string) => {
                                const isSelected = selectedOption === option;
                                const isCorrect = isSelected && option === currentQuestion.correctAnswer;
                                const isIncorrect = isSelected && option !== currentQuestion.correctAnswer;
                                return (
                                    <button key={option} onClick={() => handleSelectAnswer(option)} disabled={!!selectedOption}
                                        className={`w-full p-4 rounded-lg border-2 flex items-center justify-between transition-all ${isCorrect ? "border-green-500" : ""} ${isIncorrect ? "border-red-500" : ""} ${!isSelected ? "hover:border-blue-500" : ""}`}>
                                        <span>{option}</span>
                                        {isCorrect && <CheckCircle className="text-green-500" />}
                                        {isIncorrect && <XCircle className="text-red-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// --- Score Summary Stage ---
function ScoreSummaryStage({ allResults, onComplete }: { allResults: any, onComplete: (analysis: any) => void }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const doAnalysis = async () => {
        setIsPending(true);
        const result = await analyzeCommunicationSession(allResults);
        setAnalysis(result);
        setIsPending(false);
    }
    doAnalysis();
  }, [allResults]);

  if (isPending || !analysis) {
    return (
        <Card className="max-w-3xl mx-auto text-center">
            <CardContent className="py-12 flex flex-col items-center">
                <LoadingSpinner />
                <p className="mt-4 font-semibold text-lg">Analyzing your entire session...</p>
                <p className="text-sm text-slate-500">This may take a moment.</p>
            </CardContent>
        </Card>
    );
  }
  
  return (
      <Card className="max-w-3xl mx-auto text-center">
          <CardHeader>
              <Award className="mx-auto h-12 w-12 text-yellow-500" />
              <CardTitle className="mt-4">Practice Complete!</CardTitle>
              <CardDescription>Here is a summary of your performance.</CardDescription>
          </CardHeader>
          <CardContent>
              <p className="text-6xl font-bold text-blue-500">{analysis.scores.overall}<span className="text-3xl text-slate-400">/100</span></p>
              <Button size="lg" onClick={() => onComplete(analysis)} className="mt-8">
                View Detailed Report <ArrowRight className="ml-2" />
              </Button>
          </CardContent>
      </Card>
  );
}

// --- Progress Stepper ---
const ProgressStepper = ({ currentStage }: { currentStage: string }) => {
  const stages = ["reading", "repetition", "comprehension", "scoreSummary", "results"];
  const stageLabels: { [key: string]: string } = {
    reading: "Reading",
    repetition: "Repetition",
    comprehension: "Comprehension",
    scoreSummary: "Summary",
    results: "Report",
  };
  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className="flex justify-center items-center space-x-2 md:space-x-4 overflow-x-auto pb-2">
      {stages.slice(0, 4).map((stage, index) => (
        <React.Fragment key={stage}>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${index <= currentIndex ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
              {index < currentIndex ? <CheckCircle size={20} /> : index + 1}
            </div>
            <span className={`ml-2 font-medium capitalize whitespace-nowrap ${index <= currentIndex ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}>
              {stageLabels[stage]}
            </span>
          </div>
          {index < stages.length - 2 && <div className={`flex-1 h-1 transition-all ${index < currentIndex ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"} min-w-[20px]`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
};
