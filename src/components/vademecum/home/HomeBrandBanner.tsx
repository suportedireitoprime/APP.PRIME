import React, { memo } from "react";
import logoCoruja from "@/assets/logo-coruja.webp";

interface HomeBrandBannerProps {
  perfilLabel?: string;
}

const HomeBrandBanner: React.FC<HomeBrandBannerProps> = () => {
  return (
    <div className="flex flex-col items-start text-left z-10 relative ml-1 xs:ml-2 sm:ml-4 max-w-[260px] sm:max-w-[320px] pt-1 xs:pt-1.5 sm:pt-2">
      {/* Logotipo Oficial da Justiça / Busto Dourado (altura calibrada idêntica ao respiro do botão voltar) */}
      <div className="relative h-[48px] xs:h-[54px] sm:h-[60px] mb-1 xs:mb-1.5 flex items-center justify-start overflow-visible">
        <img
          src={logoCoruja}
          alt="Estudos Jurídicos"
          loading="eager"
          decoding="async"
          width={88}
          height={88}
          fetchPriority="high"
          className="w-auto h-[48px] xs:h-[54px] sm:h-[60px] max-w-none object-contain transform-gpu pointer-events-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_16px_rgba(230,25,66,0.35)]"
        />
      </div>

      {/* Tipografia de Marca: Estudos (branco) + Jurídicos (Carmesim Primário #E61942) - Tamanhos 100% idênticos ao Vade Mecum */}
      <h1 className="tracking-tight leading-[1.04] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
        <span className="font-serif text-[18px] xs:text-[20px] sm:text-[23px] md:text-[26px] font-medium text-white block">
          Estudos
        </span>
        <span className="font-serif italic text-[20px] xs:text-[22px] sm:text-[25px] md:text-[28px] font-semibold text-primary block drop-shadow-[0_2px_14px_rgba(230,25,66,0.65)] mt-0 xs:mt-0.5">
          Jurídicos
        </span>
      </h1>

      {/* Traço vertical carmesim e slogan oficial */}
      <div className="mt-1 xs:mt-1.5 sm:mt-2 flex items-start text-left gap-1.5">
        <div className="w-[2.5px] sm:w-[3px] h-5 sm:h-5.5 bg-gradient-to-b from-primary to-[#701526] rounded-full shrink-0 mt-0.5 shadow-[0_0_8px_rgba(230,25,66,0.55)]" />
        <p className="font-serif italic text-white/90 text-[9.5px] xs:text-[10px] sm:text-[11px] leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Conteúdo de qualidade
          <br />
          para sua jornada no Direito.
        </p>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
