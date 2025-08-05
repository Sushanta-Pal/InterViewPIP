import { FiMic, FiBarChart2, FiMessageSquare } from 'react-icons/fi';
import Feature from './Feature';

export default function FeaturesSection() {
  const features = [
    {
      icon: <FiMic className="w-10 h-10 text-blue-500" />,
      title: 'Real-time Feedback',
      description: 'Get instant analysis on your pace, pitch, and filler words as you speak.',
    },
    {
      icon: <FiBarChart2 className="w-10 h-10 text-blue-500" />,
      title: 'Progress Tracking',
      description: 'Visualize your improvement over time with detailed performance reports.',
    },
    {
      icon: <FiMessageSquare className="w-10 h-10 text-blue-500" />,
      title: 'Personalized Exercises',
      description: 'Practice with tailored scenarios for interviews, presentations, and more.',
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Everything You Need to Succeed</h2>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">A comprehensive toolkit for communication mastery.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Feature key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </div>
      </div>
    </section>
  );
}
