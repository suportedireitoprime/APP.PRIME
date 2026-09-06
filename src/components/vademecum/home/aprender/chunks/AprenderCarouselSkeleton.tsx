import { memo } from 'react';

export const AprenderCarouselSkeleton = memo(() => {
  return (
    <div className="pt-2 pb-0 -mb-6 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
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
      <div className="w-full h-[265px] -mt-6 flex items-center justify-center gap-4 px-6 overflow-hidden">
        <div className="w-[130px] h-[180px] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse shrink-0 opacity-40 -rotate-3" />
        <div className="w-[145px] h-[200px] rounded-2xl bg-white/[0.06] border border-white/10 animate-pulse shrink-0 shadow-lg scale-105" />
        <div className="w-[130px] h-[180px] rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse shrink-0 opacity-40 rotate-3" />
      </div>
    </div>
  );
});

AprenderCarouselSkeleton.displayName = 'AprenderCarouselSkeleton';
