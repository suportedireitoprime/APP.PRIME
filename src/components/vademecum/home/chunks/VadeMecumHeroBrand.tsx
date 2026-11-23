// @ts-nocheck
import React, { memo } from 'react';

const VadeMecumHeroBrand: React.FC = () => {
  return (
    <div className="flex flex-col items-start text-left z-10 relative ml-1 xs:ml-2 sm:ml-4 max-w-[260px] sm:max-w-[320px] pt-1 xs:pt-1.5 sm:pt-2">
      {/* Tipografia de Marca: Vade Mecum (branco) + Legislação (verde esmeralda da onda/Constituição) */}
      <h1 className="tracking-tight leading-[1.04] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
        <span className="font-serif text-[18px] xs:text-[20px] sm:text-[23px] md:text-[26px] font-medium text-white block">
          Vade Mecum
        </span>
        <span className="font-serif italic text-[20px] xs:text-[22px] sm:text-[25px] md:text-[28px] font-semibold text-emerald-400 block drop-shadow-[0_2px_14px_rgba(16,185,129,0.65)] mt-0 xs:mt-0.5">
          Legislação
        </span>
      </h1>

      {/* Traço vertical esmeralda e slogan oficial */}
      <div className="mt-1 xs:mt-1.5 sm:mt-2 flex items-start text-left gap-1.5">
        <div className="w-[2.5px] sm:w-[3px] h-5 sm:h-5.5 bg-gradient-to-b from-emerald-400 to-[#064e3b] rounded-full shrink-0 mt-0.5 shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
        <p className="font-serif italic text-white/90 text-[9.5px] xs:text-[10px] sm:text-[11px] leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Consulte as leis,
          <br />
          domine o Direito.
        </p>
      </div>
    </div>
  );
};

export default memo(VadeMecumHeroBrand);
