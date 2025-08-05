import React from 'react';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
