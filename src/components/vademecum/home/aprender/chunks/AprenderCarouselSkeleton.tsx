import { memo } from 'react';

export const AprenderCarouselSkeleton = memo(() => {
  return (
    <div className="pt-2 pb-1 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 overflow-hidden">
      <div className="px-5 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-[#E11D48] opacity-60" />
            <div className="w-24 h-5 bg-white/10 rounded-md animate-pulse" />
          </div>
          <div className="w-48 h-3.5 bg-white/5 rounded-md ml-3 animate-pulse" />
        </div>
        <div className="w-20 h-7 rounded-full bg-white/5 border border-white/10 animate-pulse" />
      </div>
      <div className="w-full pt-3 pb-2 flex flex-col items-center">
        <div className="relative flex items-center justify-center w-full max-w-[360px] h-[220px]">
          {/* Card Esquerda - leque inclinado */}
          <div className="absolute w-[140px] h-[192px] rounded-2xl bg-white/[0.04] border border-white/10 -translate-x-[72px] translate-y-[10px] -rotate-[9.5deg] scale-[0.88] opacity-80" />
          {/* Card Centro - destaque com borda vermelha */}
          <div className="absolute z-20 w-[140px] h-[192px] rounded-2xl bg-white/[0.08] border-[3px] border-[#E11D48]/50 shadow-[0_15px_40px_rgba(225,29,72,0.3)] scale-[1.06] flex items-end justify-center p-3">
            <div className="w-24 h-3 bg-white/20 rounded animate-pulse" />
          </div>
          {/* Card Direita - leque inclinado */}
          <div className="absolute w-[140px] h-[192px] rounded-2xl bg-white/[0.04] border border-white/10 translate-x-[72px] translate-y-[10px] rotate-[9.5deg] scale-[0.88] opacity-80" />
        </div>
        <div className="mt-3 w-44 h-3.5 bg-white/10 rounded-md animate-pulse" />
      </div>
    </div>
  );
});

AprenderCarouselSkeleton.displayName = 'AprenderCarouselSkeleton';
