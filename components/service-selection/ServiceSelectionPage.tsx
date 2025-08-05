'use client';

import Link from 'next/link';
import Card from '../common/Card';

export default function ServiceSelectionPage() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Choose a Service</h1>
      <div className="flex flex-wrap justify-center gap-8">
        <Link href="/interview-session" className='w-full md:w-auto'>
          <Card className="w-full md:w-72 h-full flex flex-col justify-center items-center hover:shadow-xl hover:-translate-y-1">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Interview Practice</h2>
            <p className='text-gray-600 dark:text-gray-400'>Practice for your next job interview.</p>
          </Card>
        </Link>
        <Link href="/communication-practice" className='w-full md:w-auto'>
          <Card className="w-full md:w-72 h-full flex flex-col justify-center items-center hover:shadow-xl hover:-translate-y-1">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Communication Practice</h2>
            <p className='text-gray-600 dark:text-gray-400'>Improve your general communication skills.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
