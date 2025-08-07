import { BrainCircuit, Mic, BarChart3, BotMessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';

const features = [
  {
    icon: <Mic className="h-8 w-8" />,
    title: 'Realistic Mock Interviews',
    description: 'Practice with an AI that simulates real interview scenarios tailored to your target role.',
  },
  {
    icon: <BotMessageSquare className="h-8 w-8" />,
    title: 'Instant AI Feedback',
    description: 'Receive immediate, detailed feedback on speech clarity, pace, filler words, and more.',
  },
  {
    icon: <BrainCircuit className="h-8 w-8" />,
    title: 'Advanced Comprehension Analysis',
    description: 'Our AI analyzes your understanding and response structure, not just your speech.',
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Track Your Progress',
    description: 'Use the personal dashboard to monitor your improvement over time with detailed analytics.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Everything You Need to Succeed
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Our platform provides powerful tools designed to build your confidence and polish your delivery.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center p-6 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex justify-center items-center mb-4 text-blue-500">
                  {feature.icon}
              </div>
              <CardHeader className="p-0">
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                <CardDescription className="mt-2 text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}