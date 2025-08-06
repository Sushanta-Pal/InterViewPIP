// lib/queue.ts
import { Queue } from 'bullmq';

// Check for all necessary Redis environment variables
if (!process.env.UPSTASH_REDIS_HOST || !process.env.UPSTASH_REDIS_PORT || !process.env.UPSTASH_REDIS_PASSWORD) {
    throw new Error("Upstash Redis connection details are not fully defined in environment variables.");
}

// Create a connection object for BullMQ.
// This is more robust than a single URL string.
const connection = {
  host: process.env.UPSTASH_REDIS_HOST,
  port: parseInt(process.env.UPSTASH_REDIS_PORT, 10),
  password: process.env.UPSTASH_REDIS_PASSWORD,
  // Upstash requires a TLS connection. This enables it.
  tls: {
    rejectUnauthorized: false
  }
};

export const analysisQueue = new Queue('analysis-jobs', { connection });
