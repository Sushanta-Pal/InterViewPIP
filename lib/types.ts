// lib/types.ts

// The structure of the feedback object within a session
export interface SessionFeedback {
  scores: {
    overall: number;
    reading: number;
    repetition: number;
    comprehension: number;
  };
  reportText: string;
}

// The complete structure of a single session in the history
export interface Session {
  id: string;
  date: string;
  type: string;
  score: number;
  feedback: SessionFeedback;
}

// The main data structure for the user's dashboard page
export interface DashboardData {
  overall_average: number;
  sessions_completed: number;
  avg_reading: number;
  avg_repetition: number;
  avg_comprehension: number;
  session_history: Session[];
}

// A separate type for the user's editable profile information
export interface UserProfile {
  full_name: string;
  university: string;
  roll_number: string;
  date_of_birth: string;
  department: string;
  gender: string;
}