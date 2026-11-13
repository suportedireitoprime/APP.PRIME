import React, { memo } from "react";
import logoCoruja from "@/assets/logo-coruja.png";

interface HomeBrandBannerProps {
  perfilLabel?: string;
}

const HomeBrandBanner: React.FC<HomeBrandBannerProps> = () => {
  return (
    <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-2 sm:ml-4 max-w-[220px]">
      {/* Logotipo Oficial da Justiça / Busto Dourado */}
      <div className="relative h-[72px] sm:h-[78px] mb-0.5 flex items-center justify-start overflow-visible">
        <img
          src={logoCoruja}
          alt="Estudos Jurídicos"
          loading="eager"
          decoding="async"
          width={88}
          height={88}
          fetchPriority="high"
          className="w-auto h-[78px] sm:h-[84px] max-w-none object-contain transform-gpu pointer-events-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_16px_rgba(230,25,66,0.35)]"
        />
      </div>

      {/* Tipografia de Marca: Estudos (branco) + Jurídicos (cor exata do botão Vade Mecum - Carmesim Primário #E61942) */}
      <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
        <span className="font-serif text-[22px] sm:text-[26px] font-medium text-white block">
          Estudos
        </span>
        <span className="font-serif italic text-[24px] sm:text-[28px] font-semibold text-primary block drop-shadow-[0_2px_14px_rgba(230,25,66,0.65)] -mt-0.5">
          Jurídicos
        </span>
      </h1>

      {/* Traço vertical carmesim e slogan oficial com a cor primária do Vade Mecum */}
      <div className="mt-2 flex items-start text-left gap-2">
        <div className="w-[3px] h-8 bg-gradient-to-b from-primary to-[#701526] rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(230,25,66,0.55)]" />
        <p className="font-serif italic text-white/90 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Conteúdo de qualidade
          <br />
          para sua jornada no Direito.
        </p>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
