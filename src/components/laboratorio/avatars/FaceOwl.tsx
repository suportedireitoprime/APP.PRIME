import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceOwl = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <ellipse cx="50" cy="50" rx="45" ry="40" fill="#8D6E63" />
      {/* Olhos */}
      <circle cx="35" cy="40" r="15" fill="#FFF" />
      <circle cx="65" cy="40" r="15" fill="#FFF" />
      <circle cx="35" cy="40" r="5" fill="#1A1A1A" />
      <circle cx="65" cy="40" r="5" fill="#1A1A1A" />
      {/* Bico/Boca */}
      <path d={mouthPath} fill="#E65100" stroke="#BF360C" strokeWidth="2" className="transition-all duration-100" />
    </svg>
  );
};
