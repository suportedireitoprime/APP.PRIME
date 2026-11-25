import React, { memo } from "react";
import logoCoruja from "@/assets/logo-coruja.webp";

interface HomeBrandBannerProps {
  perfilLabel?: string;
}

const HomeBrandBanner: React.FC<HomeBrandBannerProps> = () => {
  return (
    <div className="flex flex-col items-start text-left z-10 relative ml-1 xs:ml-2 sm:ml-4 md:ml-6 max-w-[280px] sm:max-w-[360px] md:max-w-[440px] pt-1.5 xs:pt-2 sm:pt-3">
      {/* Logotipo Oficial da Justiça / Busto Dourado */}
      <div className="relative h-[58px] xs:h-[64px] sm:h-[72px] md:h-[80px] mb-1.5 xs:mb-2 sm:mb-2.5 flex items-center justify-start overflow-visible">
        <img
          src={logoCoruja}
          alt="Estudos Jurídicos"
          loading="eager"
          decoding="async"
          width={92}
          height={92}
          fetchPriority="high"
          className="w-auto h-[58px] xs:h-[64px] sm:h-[72px] md:h-[80px] max-w-none object-contain transform-gpu pointer-events-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_16px_rgba(230,25,66,0.35)]"
        />
      </div>

      {/* Tipografia de Marca: Estudos (branco) + Jurídicos (Carmesim Primário #E61942) */}
      <h1 className="tracking-tight leading-[1.04] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
        <span className="font-serif text-[22px] xs:text-[24px] sm:text-[28px] md:text-[32px] font-medium text-white block">
          Estudos
        </span>
        <span className="font-serif italic text-[24px] xs:text-[26px] sm:text-[30px] md:text-[35px] font-semibold text-primary block drop-shadow-[0_2px_14px_rgba(230,25,66,0.65)] mt-0 xs:mt-0.5">
          Jurídicos
        </span>
      </h1>

      {/* Traço vertical carmesim e slogan oficial */}
      <div className="mt-2 xs:mt-2.5 sm:mt-3 flex items-start text-left gap-2">
        <div className="w-[3px] h-6 sm:h-7 bg-gradient-to-b from-primary to-[#701526] rounded-full shrink-0 mt-0.5 shadow-[0_0_8px_rgba(230,25,66,0.55)]" />
        <p className="font-serif italic text-white/90 text-[12.5px] xs:text-[13px] sm:text-[14.5px] md:text-[15.5px] leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Conteúdo de qualidade
          <br />
          para sua jornada no Direito.
        </p>
      </div>
    </div>
  );
};

export default memo(HomeBrandBanner);
