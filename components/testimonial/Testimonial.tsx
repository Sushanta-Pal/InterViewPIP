import Image from 'next/image';
// Corrected import using curly braces for named exports
import { Card } from '@/components/common/Card';
import React from 'react';

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

export default function Testimonial({ quote, author, role, avatar }: TestimonialProps) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <Image src={avatar} alt={author} width={80} height={80} className="rounded-full mb-4 border-2 border-blue-500" />
        <p className="mt-4 text-gray-600 dark:text-gray-300 italic text-lg">"{quote}"</p>
        <div className="mt-4">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{author}</p>
          <p className="text-gray-500 dark:text-gray-400">{role}</p>
        </div>
      </div>
    </Card>
  );
}
