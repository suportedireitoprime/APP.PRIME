import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceRobot = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      <rect x="20" y="20" width="60" height="60" rx="10" fill="#cfd8dc" stroke="#90a4ae" strokeWidth="2" />
      <rect x="30" y="35" width="15" height="10" fill="#00e5ff" />
      <rect x="55" y="35" width="15" height="10" fill="#00e5ff" />
      {/* Boca */}
      <path d={mouthPath} fill="#263238" className="transition-all duration-100" />
    </svg>
  );
};
