import { Card } from '@/components/common/Card';
import React from 'react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// The component must be exported as the default export from this file.
export default function Feature({ icon, title, description }: FeatureProps) {
  return (
    <Card className="text-center hover:shadow-xl hover:-translate-y-1">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
    </Card>
  );
}
