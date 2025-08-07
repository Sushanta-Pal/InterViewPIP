'use client';
import Link from 'next/link';
import  {Button}  from '@/components/common/Button';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-white dark:bg-slate-950 overflow-hidden">
        {/* Animated Aurora Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-radial from-blue-500/10 via-purple-500/10 to-transparent animate-pulse" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    Unlock Your
                    <span className="block mt-2 md:mt-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Confident Voice
                    </span>
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300">
                    AI-powered coaching to master your communication for interviews, presentations, and everyday conversations.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild size='lg' className="group bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                        <Link href="/dashboard">
                            Get Started for Free
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 text-slate-500">
                        <div className="flex text-yellow-400">
                            <Star className="h-5 w-5" fill="currentColor"/>
                            <Star className="h-5 w-5" fill="currentColor"/>
                            <Star className="h-5 w-5" fill="currentColor"/>
                            <Star className="h-5 w-5" fill="currentColor"/>
                            <Star className="h-5 w-5" fill="currentColor"/>
                        </div>
                        <span className="font-medium">5.0</span>
                        <span>from 100+ reviews</span>
                    </div>
                </div>
            </motion.div>
        </div>
    </section>
  );
}