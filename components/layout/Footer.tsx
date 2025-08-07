import Logo from '@/components/common/Logo';
import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <Logo />
                        <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">
                            AI-powered coaching to master your communication skills.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:col-span-3 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wider uppercase">Product</h3>
                            <ul className="mt-4 space-y-2">
                                <li><Link href="/#features" className="text-base text-slate-600 dark:text-slate-300 hover:text-blue-500">Features</Link></li>
                                <li><Link href="/#testimonials" className="text-base text-slate-600 dark:text-slate-300 hover:text-blue-500">Testimonials</Link></li>
                                <li><Link href="/dashboard" className="text-base text-slate-600 dark:text-slate-300 hover:text-blue-500">Get Started</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wider uppercase">Connect</h3>
                            <div className="flex mt-4 space-x-6">
                                <a href="#" className="text-slate-500 hover:text-blue-500"><span className="sr-only">Twitter</span><Twitter /></a>
                                <a href="https://github.com/Sushanta-Pal" className="text-slate-500 hover:text-blue-500"><span className="sr-only">GitHub</span><Github /></a>
                                <a href="https://www.linkedin.com/in/sushanta-pal-340b77254/" className="text-slate-500 hover:text-blue-500"><span className="sr-only">LinkedIn</span><Linkedin /></a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>&copy; {new Date().getFullYear()} VoiceCoach AI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}