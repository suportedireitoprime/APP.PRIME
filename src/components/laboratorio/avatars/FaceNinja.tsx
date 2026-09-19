import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceNinja = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <circle cx="50" cy="50" r="45" fill="#212121" />
      <path d="M 15 40 Q 50 30 85 40 Q 80 60 50 60 Q 20 60 15 40 Z" fill="#ffe0bd" />
      <circle cx="35" cy="45" r="5" fill="#000" />
      <circle cx="65" cy="45" r="5" fill="#000" />
      <path d={mouthPath} fill="#fff" className="transition-all duration-100" />
    </svg>
  );
};
