
import React from 'react';

interface AnimatedDividerProps {
  text: string;
}

export function AnimatedDivider({ text }: AnimatedDividerProps) {
  return (
    <div className="relative flex items-center w-full mt-10 mb-6 overflow-hidden py-2">
      <div className="flex-1 h-[2px] bg-white/10" />
      <span className="mx-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase relative z-10">
        {text}
      </span>
      <div className="flex-1 h-[2px] bg-white/10" />

      {/* The Shine Element */}
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center">
        <div 
          className="w-[120px] h-[300%] animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
            mixBlendMode: 'color-dodge',
          }}
        />
      </div>
    </div>
  );
}

