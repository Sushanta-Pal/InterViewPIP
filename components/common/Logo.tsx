import React from 'react';
import { BotMessageSquare } from 'lucide-react';

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
        <BotMessageSquare className="h-6 w-6 text-white" />
      </div>
      <span className="text-2xl font-bold text-slate-900 dark:text-white">
        VoiceCoach AI
      </span>
    </div>
  );
};

export default Logo;