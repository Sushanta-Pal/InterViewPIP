// lib/types.ts

// The structure of the feedback object
export interface SessionFeedback {
  scores: {
    overall: number;
    reading: number;
    repetition: number;
    comprehension: number;
  };
  reportText: string;
}

// The complete structure of a single session
export interface Session {
  id: string;
  date: string;
  type: string;
  score: number;
  feedback: SessionFeedback; // Added this property
}

// Your UserProfile is correct, it uses the Session type from this file
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  overall_average_score: number;
  average_reading_score: number;
  average_repeating_score: number;
  average_comprehension_score: number;
  session_history: Session[];
}