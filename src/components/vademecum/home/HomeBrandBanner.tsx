import React, { memo } from "react";
import logoCoruja from "@/assets/logo-coruja.png";

interface HomeBrandBannerProps {
  perfilLabel?: string;
}

const HomeBrandBanner: React.FC<HomeBrandBannerProps> = () => {
  return (
    <div className="flex flex-col items-center text-center gap-1 z-10 relative w-[42%] max-w-40 ml-2 sm:ml-4">
      <div className="relative w-20 h-20 sm:w-22 sm:h-22 mb-1 flex items-center justify-center">
        <img
          src={logoCoruja}
          alt="Estudos Jurídicos"
          loading="eager"
          decoding="async"
          width={96}
          height={96}
          fetchPriority="high"
          className="w-full h-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)]"
        />
      </div>
      <h1 className="font-serif italic text-white text-[18px] sm:text-[20px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] whitespace-nowrap">
        Estudos Jurídicos
      </h1>
      <p className="font-body text-white/95 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
        USO PROFISSIONAL
      </p>

      <div className="mt-3 flex items-center text-left gap-2 w-full justify-center">
        <div className="w-0.5 h-7 bg-white/40 rounded-full" />
        <p className="font-serif italic text-white/80 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Domine as leis,
          <br />
          imponha respeito.
        </p>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
