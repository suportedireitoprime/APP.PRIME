import React from 'react';

interface AnimatedDividerProps {
  text: string;
}

export function AnimatedDivider({ text }: AnimatedDividerProps) {
  return (
    <div className="relative flex items-center w-full mt-10 mb-6 py-2 group">
      {/* Base Layer (Dim) */}
      <div className="flex-1 h-[2px] bg-white/10" />
      <span className="mx-4 text-xs font-semibold tracking-widest text-zinc-400 uppercase">
        {text}
      </span>
      <div className="flex-1 h-[2px] bg-white/10" />

      {/* Shine Layer (Bright) */}
      <div 
        className="absolute inset-0 flex items-center pointer-events-none"
        style={{
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 50%, transparent 100%)',
          WebkitMaskSize: '50% 100%',
          WebkitMaskRepeat: 'no-repeat',
          animation: 'mask-slide 3s infinite linear'
        }}
      >
        <div className="flex-1 h-[2px] bg-white" style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
        <span className="mx-4 text-xs font-semibold tracking-widest text-white uppercase" style={{ textShadow: '0 0 8px rgba(255,255,255,0.8)' }}>
          {text}
        </span>
        <div className="flex-1 h-[2px] bg-white" style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
      </div>

      <style>{`
        @keyframes mask-slide {
          0% {
            -webkit-mask-position: -150% 0;
            mask-position: -150% 0;
          }
          100% {
            -webkit-mask-position: 250% 0;
            mask-position: 250% 0;
          }
        }
      `}</style>
    </div>
  );
}

