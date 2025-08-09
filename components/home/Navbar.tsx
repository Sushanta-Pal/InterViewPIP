'use client';

import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import {Button}  from '@/components/common/Button';
import ThemeToggle from '@/components/common/ThemeToggle';
import Logo from '@/components/common/Logo';

export default function Navbar() {
  const { isSignedIn } = useAuth();

  return (
    <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {isSignedIn ? (
            <div className='flex items-center space-x-4'>
              <Button asChild variant='ghost'>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
               <UserButton 
                afterSignOutUrl="/" 
                userProfileUrl="/dashboard/profile" // Add this line
              />
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-2">
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}