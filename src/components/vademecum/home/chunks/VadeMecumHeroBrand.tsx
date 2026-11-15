// @ts-nocheck
import React, { memo } from 'react';

const VadeMecumHeroBrand: React.FC = () => {
  return (
    <div className="flex flex-col items-start text-left gap-1 z-10 relative ml-2 sm:ml-4 max-w-[220px] pt-12 sm:pt-14">
      {/* Tipografia de Marca: Vade Mecum (branco) + Legislação (verde esmeralda da onda/Constituição) */}
      <h1 className="tracking-tight leading-[1.02] drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
        <span className="font-serif text-[24px] sm:text-[28px] font-medium text-white block">
          Vade Mecum
        </span>
        <span className="font-serif italic text-[26px] sm:text-[30px] font-semibold text-emerald-400 block drop-shadow-[0_2px_14px_rgba(16,185,129,0.65)] -mt-0.5">
          Legislação
        </span>
      </h1>

      {/* Traço vertical esmeralda e slogan oficial */}
      <div className="mt-2.5 flex items-start text-left gap-2">
        <div className="w-[3px] h-8 bg-gradient-to-b from-emerald-400 to-[#064e3b] rounded-full shrink-0 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.55)]" />
        <p className="font-serif italic text-white/90 text-[11.5px] sm:text-[12.5px] leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
          Consulte as leis,
          <br />
          domine o Direito.
        </p>
      </div>
    </div>
  );
};

export default memo(VadeMecumHeroBrand);
