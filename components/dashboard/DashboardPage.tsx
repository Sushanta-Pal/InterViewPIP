'use client';

import { useUser } from '@clerk/nextjs';
import Card from '../common/Card';
import Button from '../common/Button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Welcome, {user?.firstName}!</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">What would you like to work on today?</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className='hover:shadow-xl hover:-translate-y-1'>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Communication Practice</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">Practice your speaking skills with various exercises.</p>
          <Link href="/communication-practice">
            <Button>Start Practice</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
