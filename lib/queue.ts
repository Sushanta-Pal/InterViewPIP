// lib/queue.ts

import { Queue } from 'bullmq';

// Define the structure of an individual audio item
interface AudioItem {
  url: string;      // Public URL from Supabase
  path: string;     // File path in the bucket for deletion
  originalText: string;
}

// Define the structure of the data for an analysis job
export interface AnalysisJobData {
  userId: string;
  allResults: any;
  userProfile: any;
  readingAudio: AudioItem[];
  repetitionAudio: AudioItem[];
}

// Ensure Redis connection details are loaded from environment variables
const redisConnection = {
  host: process.env.UPSTASH_REDIS_HOST,
  port: parseInt(process.env.UPSTASH_REDIS_PORT!),
  password: process.env.UPSTASH_REDIS_PASSWORD,
};

// Create a new queue for analysis jobs
export const analysisQueue = new Queue<AnalysisJobData>('analysis-jobs', {
  connection: redisConnection,
});