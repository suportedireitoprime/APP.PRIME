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
      <div className="w-full pt-4 pb-4 flex items-center justify-center gap-3.5 px-4 overflow-hidden">
        <div className="w-[114px] aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse shrink-0 opacity-55 scale-[0.86]" />
        <div className="w-[114px] aspect-[2/3] rounded-2xl bg-white/[0.08] border border-white/20 animate-pulse shrink-0 opacity-100 scale-[1.14] shadow-2xl relative">
          <div className="absolute -bottom-8 left-0 right-0 flex flex-col items-center gap-1">
            <div className="w-16 h-3 bg-white/15 rounded-md animate-pulse" />
            <div className="w-10 h-2.5 bg-white/10 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="w-[114px] aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse shrink-0 opacity-55 scale-[0.86]" />
      </div>
    </div>
  );
});

AprenderCarouselSkeleton.displayName = 'AprenderCarouselSkeleton';
