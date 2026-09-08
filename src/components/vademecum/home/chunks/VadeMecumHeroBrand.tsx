import React, { memo } from 'react';
import brasaoImg from '@/assets/brasao-republica.webp';

const VadeMecumHeroBrand: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center gap-1 z-[10] relative w-[42%] max-w-[160px] ml-2 sm:ml-4">
      <div className="relative h-[75px] mb-1 flex items-center justify-center">
        <img
          src={brasaoImg}
          alt="Brasão da República Federativa do Brasil"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={75}
          height={75}
          className="w-auto h-[75px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
        />
      </div>
      <h1 className="font-serif italic text-white text-[18px] sm:text-[20px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] whitespace-nowrap">
        Vade Mecum
      </h1>
      <p className="font-body text-white/95 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
        LEGISLAÇÃO COMPLETA
      </p>
      
      <div className="mt-3 flex items-center text-left gap-2 w-full justify-center">
        <div className="w-[2px] h-7 bg-white/40 rounded-full" />
        <p className="font-serif italic text-white/80 text-[11px] sm:text-[12px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Consulte as leis,<br/>domine o Direito.
        </p>
      </div>
    </div>
  );
};

export default memo(VadeMecumHeroBrand);
