import { useState, useRef, useEffect } from 'react';
import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk';

export const useDeepgram = (onTranscriptReceived: (transcript: string) => void) => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const deepgramConnection = useRef<LiveClient | null>(null);
    const microphone = useRef<MediaRecorder | null>(null);

    const startRecording = async () => {
        setIsRecording(true);
        setTranscript("");

        try {
            const response = await fetch('/api/deepgram/token');
            if (!response.ok) {
                throw new Error(`Failed to get Deepgram token. Status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.key) throw new Error("Deepgram token is missing from the API response.");

            const deepgram = createClient(data.key);
            const connection = deepgram.listen.live({ model: "nova-2", smart_format: true, interim_results: true });
            deepgramConnection.current = connection;

            connection.on(LiveTranscriptionEvents.Open, async () => {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                microphone.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                microphone.current.ondataavailable = (e) => connection.send(e.data);
                microphone.current.start(250);
            });

            connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                const currentTranscript = data.channel.alternatives[0].transcript;
                if (currentTranscript) {
                    setTranscript(currentTranscript);
                    console.log("Live Transcript:", currentTranscript); // Real-time logging
                }
                if (data.is_final && currentTranscript) {
                    onTranscriptReceived(currentTranscript);
                    stopRecording(); // Automatically stop after a final transcript
                }
            });

            connection.on(LiveTranscriptionEvents.Error, (error) => {
                console.error("Deepgram Error:", error);
                stopRecording();
            });

            connection.on(LiveTranscriptionEvents.Close, () => {
                // Cleanup
            });

        } catch (err) {
            console.error(err);
            alert("Could not connect to transcription service. Please check microphone permissions and API keys.");
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (microphone.current?.state === 'recording') {
            microphone.current.stop();
        }
        if (deepgramConnection.current) {
            deepgramConnection.current.finish();
        }
        setIsRecording(false);
    };

    return { isRecording, startRecording, stopRecording, transcript };
};
