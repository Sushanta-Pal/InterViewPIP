import { Worker } from 'bullmq';
import path from 'path';

console.log("Worker process starting...");

if (!process.env.UPSTASH_REDIS_HOST || !process.env.UPSTASH_REDIS_PORT || !process.env.UPSTASH_REDIS_PASSWORD) {
    throw new Error("Upstash Redis connection details are not fully defined for worker.");
}

// We point to the compiled JavaScript file in the `dist` directory
const processorFile = path.join(__dirname, 'analysisProcessor.js');

const connection = {
  host: process.env.UPSTASH_REDIS_HOST,
  port: parseInt(process.env.UPSTASH_REDIS_PORT, 10),
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false
  }
};

const worker = new Worker('analysis-jobs', processorFile, {
  connection,
  concurrency: 5, // Process 5 jobs in parallel
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 5000 },
});

worker.on('completed', job => {
  console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});

console.log("Worker started and listening for jobs.");
