import React, { memo } from "react";
import logoCoruja from "@/assets/logo-coruja.png";

export const PilulasBrandBanner: React.FC = () => {
  return (
    <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-2 sm:ml-4 max-w-[230px]">
      {/* Logotipo Oficial da Justiça / Busto Dourado */}
      <div className="relative h-[72px] sm:h-[78px] mb-0.5 flex items-center justify-start overflow-visible">
        <img
          src={logoCoruja}
          alt="Pílulas do Direito"
          loading="eager"
          decoding="async"
          width={88}
          height={88}
          fetchPriority="high"
          className="w-auto h-[78px] sm:h-[84px] max-w-none object-contain transform-gpu pointer-events-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_16px_rgba(244,63,94,0.4)]"
        />
      </div>

      {/* Tipografia de Marca: Pílulas (branco) + em Áudio (coral crepuscular itálico) */}
      <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
        <span className="font-serif text-[22px] sm:text-[26px] font-medium text-white block">
          Pílulas
        </span>
        <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-[#FB7185] block drop-shadow-[0_2px_14px_rgba(244,63,94,0.65)] -mt-0.5">
          em Áudio
        </span>
      </h1>

      {/* Traço vertical coral crepuscular e slogan */}
      <div className="mt-2 flex items-start text-left gap-2">
        <div className="w-[3px] h-8 bg-gradient-to-b from-[#FB7185] via-rose-500 to-rose-900 rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
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
