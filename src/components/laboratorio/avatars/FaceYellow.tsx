import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceYellow = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      {/* Rosto Circular Amarelo */}
      <circle cx="50" cy="50" r="45" fill="#ffeb3b" stroke="#fbc02d" strokeWidth="2" />
      {/* Olhos (simples) */}
      <ellipse cx="35" cy="40" rx="4" ry="8" fill="#3e2723" />
      <ellipse cx="65" cy="40" rx="4" ry="8" fill="#3e2723" />
      {/* Bochechas */}
      <circle cx="25" cy="55" r="6" fill="#ff5252" opacity="0.4" />
      <circle cx="75" cy="55" r="6" fill="#ff5252" opacity="0.4" />
      {/* Boca */}
      <path d={mouthPath} fill="#3e2723" stroke="#3e2723" strokeWidth="2" strokeLinejoin="round" className="transition-all duration-100" />
    </svg>
  );
};
