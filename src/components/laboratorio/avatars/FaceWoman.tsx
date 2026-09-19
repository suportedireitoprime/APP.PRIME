import React from 'react';
import { getMouthPath } from './VisemeDictionary';

export const FaceWoman = ({ viseme, volume }: { viseme: string; volume: number }) => {
  const mouthPath = getMouthPath(viseme);
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
      {/* Cabelo Fundo */}
      <path d="M 10 50 Q 10 90 30 100 L 70 100 Q 90 90 90 50 Z" fill="#2c1d11" />
      {/* Rosto */}
      <circle cx="50" cy="50" r="35" fill="#f5d0b5" />
      {/* Olhos */}
      <circle cx="35" cy="45" r="5" fill="#4e342e" />
      <circle cx="65" cy="45" r="5" fill="#4e342e" />
      <circle cx="34" cy="44" r="1.5" fill="#fff" />
      <circle cx="64" cy="44" r="1.5" fill="#fff" />
      {/* Cabelo Frente */}
      <path d="M 15 50 Q 25 20 50 15 Q 75 20 85 50 Q 70 25 50 25 Q 30 25 15 50 Z" fill="#3e2723" />
      {/* Nariz */}
      <path d="M 50 50 Q 52 55 50 55" fill="none" stroke="#a1887f" strokeWidth="2" strokeLinecap="round" />
      {/* Boca */}
      <path d={mouthPath} fill="#E91E63" stroke="#C2185B" strokeWidth="2" className="transition-all duration-100" />
    </svg>
  );
};
