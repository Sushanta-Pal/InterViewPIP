// app/api/analyze/route.ts

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
    
    // Use a placeholder if the transcript is empty
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "[No speech detected]";
    
    return transcript;
}

// --- GEMINI ANALYSIS FUNCTION WITH RETRY LOGIC ---
async function getAiFeedback(
    transcripts: { reading: any[]; repetition: any[] },
    comprehensionResults: any[]
) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    
    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ];

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
        safetySettings,
    });

    const readingTasks = transcripts.reading.map((item, index) => 
        `Task ${index + 1}: Original Text: "${item.originalText}"\nUser's Transcript: "${item.transcript}"`
    ).join('\n\n');

    const repetitionTasks = transcripts.repetition.map((item, index) => 
        `Task ${index + 1}: Original Phrase: "${item.originalText}"\nUser's Transcript: "${item.transcript}"`
    ).join('\n\n');
    
    const comprehensionScore = Math.round((comprehensionResults.filter(r => r.isCorrect).length / comprehensionResults.length) * 100) || 100;

    const prompt = `
        You are an expert communication coach. Analyze the user's performance based on the following data.
        If a transcript is "[No speech detected]", it means the user did not speak. Score accordingly.

        PART 1: READING ALOUD
        ${readingTasks}

        PART 2: REPETITION
        ${repetitionTasks}
        
        PART 3: ANALYSIS TASK
        1. Calculate a 'reading' score (0-100) based on accuracy.
        2. Calculate a 'repetition' score (0-100) based on accuracy.
        3. The user's 'comprehension' score is ${comprehensionScore}.
        4. Calculate an 'overall' score by averaging the three scores.
        5. Write a detailed 'reportText' in HTML format with constructive feedback.

        Return a single JSON object with this structure:
        {
          "scores": { "overall": number, "reading": number, "repetition": number, "comprehension": number },
          "reportText": "<html>_string"
        }
    `;

    // Retry logic with exponential backoff
    let attempts = 0;
    while (attempts < 3) {
        try {
            const result = await model.generateContent(prompt);
            return JSON.parse(result.response.text());
        } catch (error: any) {
            if (error.status === 503 && attempts < 2) {
                const delay = Math.pow(2, attempts) * 1000; // 1s, 2s
                console.warn(`Google AI API is overloaded. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempts++;
            } else {
                throw error;
            }
        }
    }
}

// --- MAIN API ROUTE HANDLER ---
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const results = JSON.parse(formData.get('results') as string);
        
        const transcripts = { reading: [] as any[], repetition: [] as any[] };

        const readingPromises = results.reading.map(async (item: any, i: number) => {
            const audioBlob = formData.get(`reading_audio_${i}`) as Blob;
            if (audioBlob) {
                const transcript = await transcribeAudio(audioBlob);
                transcripts.reading.push({ originalText: item.originalText, transcript });
            }
        });

        const repetitionPromises = results.repetition.map(async (item: any, i: number) => {
            const audioBlob = formData.get(`repetition_audio_${i}`) as Blob;
            if (audioBlob) {
                const transcript = await transcribeAudio(audioBlob);
                transcripts.repetition.push({ originalText: item.originalText, transcript });
            }
        });

        await Promise.all([...readingPromises, ...repetitionPromises]);
        const analysis = await getAiFeedback(transcripts, results.comprehension);
        return NextResponse.json(analysis);

    } catch (error: any) {
        console.error("Error in analysis API:", error);
        return NextResponse.json({ error: error.message || "Failed to analyze session." }, { status: 500 });
    }
}