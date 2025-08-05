'use client';

import { useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { FiMic, FiSquare } from 'react-icons/fi';

export default function CommunicationPracticePage() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <Card>
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Communication Practice</h1>
      <p className="mb-4 text-gray-600 dark:text-gray-400">Read the following text aloud:</p>
      <blockquote className="italic bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-6 border-l-4 border-blue-500">
        <p className='text-gray-800 dark:text-gray-200'>"The quick brown fox jumps over the lazy dog. This sentence is a classic pangram, which means it contains every letter of the alphabet."</p>
      </blockquote>
      <div className='text-center'>
        <Button onClick={() => setIsRecording(!isRecording)} size='lg' className='flex items-center gap-2'>
          {isRecording ? <><FiSquare /> Stop Recording</> : <><FiMic /> Start Recording</>}
        </Button>
        {isRecording && <p className='mt-4 text-red-500 animate-pulse'>Recording...</p>}
      </div>
    </Card>
  );
}
