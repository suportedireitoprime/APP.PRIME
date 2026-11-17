import React, { memo } from "react";
import logoCoruja from "@/assets/logo-coruja.webp";

interface HomeBrandBannerProps {
  perfilLabel?: string;
}

const HomeBrandBanner: React.FC<HomeBrandBannerProps> = () => {
  return (
    <div className="flex flex-col items-start text-left gap-0.5 z-10 relative ml-2 sm:ml-4 max-w-[220px]">
      {/* Logotipo Oficial da Justiça / Busto Dourado */}
      <div className="relative h-[60px] sm:h-[66px] flex items-center justify-start overflow-visible">
        <img
          src={logoCoruja}
          alt="Estudos Jurídicos"
          loading="eager"
          decoding="async"
          width={80}
          height={80}
          fetchPriority="high"
          className="w-auto h-[64px] sm:h-[70px] max-w-none object-contain transform-gpu pointer-events-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_16px_rgba(229,9,20,0.35)]"
        />
      </div>

      {/* Tipografia de Marca: Estudos (branco) + Jurídicos (carmesim itálico) */}
      <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
        <span className="font-serif text-[20px] sm:text-[23px] font-medium text-white block">
          Estudos
        </span>
        <span className="font-serif italic text-[22px] sm:text-[25px] font-semibold text-[#E50914] block drop-shadow-[0_2px_14px_rgba(229,9,20,0.65)] -mt-0.5">
          Jurídicos
        </span>
      </h1>

      {/* Traço vertical carmesim e slogan oficial */}
      <div className="mt-1 flex items-start text-left gap-1.5">
        <div className="w-[2.5px] h-6 bg-gradient-to-b from-[#E50914] to-red-800 rounded-full shrink-0 mt-0.5 shadow-[0_0_8px_rgba(229,9,20,0.55)]" />
        <p className="font-serif italic text-white/90 text-[10.5px] sm:text-[11px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Conteúdo de qualidade
          <br />
          para sua jornada no Direito.
        </p>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
