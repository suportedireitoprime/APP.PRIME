import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceCat = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <ellipse cx="50" cy="50" rx="40" ry="35" fill="#FFA500" />
      <circle cx="35" cy="40" r="5" fill="#FFF" />
      <circle cx="65" cy="40" r="5" fill="#FFF" />
      <path d={mouthPath} fill="#212121" className="transition-all duration-100" />
    </svg>
  );
};
