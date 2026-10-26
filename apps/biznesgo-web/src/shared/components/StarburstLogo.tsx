import React from 'react';

export const StarburstLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 12 ta aylanuvchi oval/kapsula nurlar */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="46"
          y="6"
          width="8"
          height="32"
          rx="4"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
    </svg>
  );
};
