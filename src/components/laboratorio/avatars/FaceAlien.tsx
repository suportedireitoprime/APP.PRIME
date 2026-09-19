import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceAlien = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <path d="M 20 40 Q 50 -10 80 40 Q 90 90 50 95 Q 10 90 20 40 Z" fill="#4caf50" />
      <ellipse cx="32" cy="50" rx="14" ry="20" fill="#111" transform="rotate(-20 32 50)" />
      <ellipse cx="68" cy="50" rx="14" ry="20" fill="#111" transform="rotate(20 68 50)" />
      <path d={mouthPath} fill="#111" className="transition-all duration-100" />
    </svg>
  );
};
