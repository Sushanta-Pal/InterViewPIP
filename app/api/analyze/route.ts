// 1. Create this file at: app/api/analyze/route.ts
// This is the secure backend endpoint for transcription and AI analysis.

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// --- DEEPGRAM TRANSCRIPTION FUNCTION ---
async function transcribeAudio(audioBlob: Blob): Promise<string> {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) throw new Error("Deepgram API key not configured.");

    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
        method: "POST",
        headers: {
            Authorization: `Token ${DEEPGRAM_API_KEY}`,
            "Content-Type": audioBlob.type || 'audio/webm',
        },
        body: audioBlob,
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Deepgram API Error:", errorText);
        throw new Error(`Deepgram transcription failed with status: ${response.status}`);
    }

    const data = await response.json();

    // --- ADDED FOR DEBUGGING ---
    console.log("--- DEEPGRAM RAW RESPONSE ---");
    console.log(JSON.stringify(data, null, 2)); // Log the full response
    
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";
    
    console.log("--- TRANSCRIBED TEXT ---");
    console.log(transcript); // Log the final transcript
    // ---------------------------
    
    return transcript;
}

// --- GEMINI ANALYSIS FUNCTION ---
async function getAiFeedback(transcripts: { reading: any[], repetition: any[] }, comprehensionResults: any[]) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    // Dynamically build the sections of the prompt to handle all questions
    const readingTasks = transcripts.reading.map((item, index) => 
        `Task ${index + 1}:
        Original Text: "${item.originalText}"
        User's Transcript: "${item.transcript}"`
    ).join('\n\n');

    const repetitionTasks = transcripts.repetition.map((item, index) => 
        `Task ${index + 1}:
        Original Phrase: "${item.originalText}"
        User's Transcript: "${item.transcript}"`
    ).join('\n\n');
    
    const comprehensionScore = Math.round((comprehensionResults.filter(r => r.isCorrect).length / comprehensionResults.length) * 100) || 100;

    const prompt = `
        You are an expert communication coach providing feedback on a practice session.
        Analyze the user's performance based on the following data.

        PART 1: READING ALOUD
        The user was asked to read several paragraphs. Here is the original text versus their transcribed speech.
        ${readingTasks}

        PART 2: REPETITION
        The user was asked to listen to and repeat several phrases. Here is the original phrase versus their transcribed speech.
        ${repetitionTasks}
        
        PART 3: ANALYSIS TASK
        Based on all the data, perform the following actions:
        1.  Calculate a 'reading' score from 0-100. Base this on accuracy, missed words, and added words in the reading tasks.
        2.  Calculate a 'repetition' score from 0-100. Base this on how closely the user's transcript matches the original phrase in the repetition tasks.
        3.  The user's 'comprehension' score, calculated previously, is ${comprehensionScore}.
        4.  Calculate an 'overall' score by averaging the reading, repetition, and comprehension scores.
        5.  Write a detailed 'reportText' in HTML format. The report should have a main title, an overall summary, and separate sections for Reading Clarity, Repetition Accuracy, and Listening Comprehension. Provide constructive feedback and actionable next steps.

        Return your entire analysis as a single JSON object with this exact structure:
        {
          "scores": {
            "overall": number,
            "reading": number,
            "repetition": number,
            "comprehension": number
          },
          "reportText": "<html>_string"
        }
    `;

    const result = await model.generateContent(prompt);
    const jsonResponse = JSON.parse(result.response.text());
    return jsonResponse;
}

// --- MAIN API ROUTE HANDLER ---
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const results = JSON.parse(formData.get('results') as string);
        
        const transcripts = { reading: [] as any[], repetition: [] as any[] };

        // Process reading audio files concurrently
        const readingPromises = results.reading.map(async (item: any, i: number) => {
            const audioBlob = formData.get(`reading_audio_${i}`) as Blob;
            if (!audioBlob) return;
            const transcript = await transcribeAudio(audioBlob);
            transcripts.reading.push({ originalText: item.originalText, transcript });
        });

        // Process repetition audio files concurrently
        const repetitionPromises = results.repetition.map(async (item: any, i: number) => {
            const audioBlob = formData.get(`repetition_audio_${i}`) as Blob;
            if (!audioBlob) return;
            const transcript = await transcribeAudio(audioBlob);
            transcripts.repetition.push({ originalText: item.originalText, transcript });
        });

        await Promise.all([...readingPromises, ...repetitionPromises]);

        // Get the final feedback from Gemini
        const analysis = await getAiFeedback(transcripts, results.comprehension);

        return NextResponse.json(analysis);

    } catch (error: any) {
        console.error("Error in analysis API:", error);
        return NextResponse.json({ error: error.message || "Failed to analyze session." }, { status: 500 });
    }
}