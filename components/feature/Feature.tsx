import Card from '../common/Card';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function Feature({ icon, title, description }: FeatureProps) {
  return (
    <Card className="text-center hover:shadow-xl hover:-translate-y-1">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 mb-6">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400">{description}</p>
    </Card>
  );
}
