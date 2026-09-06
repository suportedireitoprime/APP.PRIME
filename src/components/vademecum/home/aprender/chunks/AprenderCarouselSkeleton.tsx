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
        <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[420px] h-[240px] sm:h-[258px]">
          {/* Cards Fundo Extremo */}
          <div className="absolute w-[140px] h-[192px] rounded-2xl bg-white/[0.02] border border-white/5 -translate-x-[156px] translate-y-[29px] -rotate-[22deg] scale-[0.67] opacity-40" />
          <div className="absolute w-[140px] h-[192px] rounded-2xl bg-white/[0.02] border border-white/5 translate-x-[156px] translate-y-[29px] rotate-[22deg] scale-[0.67] opacity-40" />

          {/* Cards Meio-Fundo */}
          <div className="absolute w-[140px] h-[192px] rounded-2xl bg-white/[0.03] border border-white/10 -translate-x-[118px] translate-y-[19px] -rotate-[15.5deg] scale-[0.78] opacity-65" />
          <div className="absolute w-[140px] h-[192px] rounded-2xl bg-white/[0.03] border border-white/10 translate-x-[118px] translate-y-[19px] rotate-[15.5deg] scale-[0.78] opacity-65" />

          {/* Cards Laterais Frontais */}
          <div className="absolute z-10 w-[140px] h-[192px] rounded-2xl bg-white/[0.05] border border-white/10 -translate-x-[68px] translate-y-[9px] -rotate-[8.5deg] scale-[0.9] opacity-85" />
          <div className="absolute z-10 w-[140px] h-[192px] rounded-2xl bg-white/[0.05] border border-white/10 translate-x-[68px] translate-y-[9px] rotate-[8.5deg] scale-[0.9] opacity-85" />

          {/* Card Centro - destaque com borda iluminada e reflexo inferior */}
          <div className="absolute z-20 w-[140px] sm:w-[152px] h-[192px] sm:h-[208px] rounded-2xl bg-white/[0.08] border-[3.5px] border-white/20 shadow-[0_15px_40px_rgba(255,255,255,0.1)] scale-[1.07] flex items-end justify-center p-3">
            <div className="w-24 h-3 bg-white/20 rounded animate-pulse" />
          </div>
          <div className="absolute top-[calc(50%+108px)] w-[140px] sm:w-[152px] h-[40px] sm:h-[46px] rounded-b-xl bg-white/[0.02] opacity-50 blur-[0.5px]" />
        </div>
        <div className="mt-2 w-44 h-3.5 bg-white/10 rounded-md animate-pulse" />
      </div>
    </div>
  );
});

AprenderCarouselSkeleton.displayName = 'AprenderCarouselSkeleton';
