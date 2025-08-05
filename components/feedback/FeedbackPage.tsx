'use client';

import Card from '../common/Card';
import Button from '../common/Button';
import Link from 'next/link';

// Placeholder data
const feedback = {
  clarity: 85,
  pace: 78,
  fillerWords: 5,
  sentiment: 'Positive',
  suggestions: [
    'Try to vary your pitch more to sound more engaging.',
    'Good job on keeping filler words to a minimum!',
    'Your pace was consistent and easy to follow.'
  ]
};

export default function FeedbackPage() {
  return (
    <Card>
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Session Feedback</h1>
      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Clarity: <span className='text-blue-500'>{feedback.clarity}%</span></h2>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${feedback.clarity}%` }}></div>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Pace: <span className='text-green-500'>{feedback.pace} words/minute</span></h2>
           <p className='text-sm text-gray-500 dark:text-gray-400'>(Ideal: 70-80 wpm)</p>
        </div>
        <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Filler Words: <span className='text-red-500'>{feedback.fillerWords}</span></h2>
        </div>
         <div>
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Overall Sentiment: <span className='text-purple-500'>{feedback.sentiment}</span></h2>
        </div>
        <div>
            <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">Suggestions for Improvement</h2>
            <ul className='list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400'>
                {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
        </div>
      </div>
      <div className='mt-8 text-center'>
        <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </Card>
  );
}
