import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceBear = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <circle cx="50" cy="50" r="40" fill="#8d6e63" />
      <circle cx="35" cy="40" r="5" fill="#3e2723" />
      <circle cx="65" cy="40" r="5" fill="#3e2723" />
      <path d={mouthPath} fill="#3e2723" className="transition-all duration-100" />
    </svg>
  );
};
