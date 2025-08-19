'use client';

import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import ThemeToggle from '@/components/common/ThemeToggle';
import Logo from '@/components/common/Logo';

export default function Navbar() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    // Function to fetch the initial session
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    getSession();

    // Listener for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Cleanup the listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {session ? (
            // This is your original "is signed in" design
            <div className='flex items-center space-x-4'>
              <Button asChild variant='ghost'>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
               {/* We replace the UserButton with a simple Sign Out button */}
               <Button onClick={handleSignOut} variant="outline">
                 Sign Out
               </Button>
            </div>
          ) : (
            // This is your original "is signed out" design
            <div className="hidden sm:flex items-center space-x-2">
              <Button asChild variant="ghost">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}