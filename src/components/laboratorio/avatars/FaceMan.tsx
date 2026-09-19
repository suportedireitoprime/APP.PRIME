import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceMan = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <rect x="25" y="20" width="50" height="70" rx="20" fill="#f5d0b5" />
      <circle cx="35" cy="40" r="4" fill="#4e342e" />
      <circle cx="65" cy="40" r="4" fill="#4e342e" />
      <path d={mouthPath} fill="#bcaaa4" className="transition-all duration-100" />
    </svg>
  );
};
