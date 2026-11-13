import React, { memo } from "react";

export const PilulasBrandBanner: React.FC = () => {
  return (
    <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-2 sm:ml-4 max-w-[240px]">
      {/* Tipografia de Marca: Pílulas (branco) + em Áudio (âmbar dourado no tom do céu) */}
      <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
        <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
          Pílulas
        </span>
        <span className="font-serif italic text-[26px] sm:text-[30px] font-semibold text-[#FBBF24] block drop-shadow-[0_2px_14px_rgba(245,158,11,0.65)] -mt-0.5">
          em Áudio
        </span>
      </h1>

      {/* Traço vertical âmbar dourado e slogan */}
      <div className="mt-2 flex items-start text-left gap-2">
        <div className="w-[3px] h-8 bg-gradient-to-b from-[#FBBF24] via-amber-500 to-amber-900 rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
        <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Resumos de alta precisão.
          <br />
          Domine o Direito em minutos.
        </p>
      </div>
    </div>
  );
};

export default memo(PilulasBrandBanner);
