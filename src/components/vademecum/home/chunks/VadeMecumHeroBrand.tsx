import React, { memo } from 'react';
import brasaoImg from '@/assets/brasao-republica.webp';

const VadeMecumHeroBrand: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="relative h-24 mb-2 flex items-center justify-center">
        <img
          src={brasaoImg}
          alt="Brasão da República Federativa do Brasil"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-auto h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
        />
      </div>
      <h1 className="font-serif italic text-white text-[24px] sm:text-[28px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
        Vade Mecum
      </h1>
      <p className="font-body text-white/85 text-[12.5px] sm:text-[13.5px] font-medium tracking-widest uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
        Legislação Completa
      </p>
    </div>
  );
};

export default memo(VadeMecumHeroBrand);
