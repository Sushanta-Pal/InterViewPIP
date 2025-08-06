// lib/types.ts

export interface Session {
    id: string;
    date: string;
    type: string;
    score: number;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    overall_average_score: number;
    average_reading_score: number;
    average_repeating_score: number;
    average_comprehension_score: number; // Added this line
    session_history: Session[];
}