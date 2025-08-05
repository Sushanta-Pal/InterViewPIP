'use client';

import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import Button from '../common/Button';
import ThemeToggle from '../common/ThemeToggle';

export default function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
          VoiceCoach AI
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {isSignedIn ? (
            <div className='flex items-center space-x-4'>
                <Link href="/dashboard">
                    <Button variant='ghost'>Dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
                <Link href="/sign-in">
                    <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                    <Button>Sign Up</Button>
                </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
