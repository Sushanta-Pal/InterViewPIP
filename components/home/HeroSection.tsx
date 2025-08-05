import Link from 'next/link';
import Button from '../common/Button';

export default function HeroSection() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
          Unlock Your Confident Voice
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          AI-powered coaching to master your communication skills for interviews, presentations, and everyday conversations.
        </p>
        <div className="mt-8">
            <Link href="/dashboard">
                <Button size='lg'>Get Started for Free</Button>
            </Link>
        </div>
      </div>
    </section>
  );
}
