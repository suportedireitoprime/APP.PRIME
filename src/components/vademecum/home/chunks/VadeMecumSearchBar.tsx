import React, { memo } from 'react';
import { Search } from 'lucide-react';
import TypingHint from '@/components/vademecum/home/TypingHint';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  onBuscar: () => void;
}

const VadeMecumSearchBar: React.FC<Props> = ({ onBuscar }) => {
  return (
    <button
      type="button"
      onClick={() => {
        haptic.selection();
        onBuscar();
      }}
      role="button"
      aria-haspopup="dialog"
      aria-label="Pesquisar artigos e leis no Vade Mecum"
      className="mt-2 relative w-full flex items-center h-[60px] sm:h-16 pl-11 sm:pl-14 pr-[94px] sm:pr-[102px] rounded-2xl bg-black/55 backdrop-blur-md border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine text-left cursor-pointer"
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 pointer-events-none" strokeWidth={2.2} />
      <span className="relative z-[2] font-body text-white/75 text-[14px] sm:text-[15px] font-medium truncate pointer-events-none">
        <TypingHint />
      </span>
      <div 
        aria-hidden="true"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 sm:h-12 px-3.5 sm:px-4.5 rounded-xl bg-brand-gradient text-white font-display text-[12px] sm:text-[13px] font-bold tracking-wide flex items-center justify-center pointer-events-none select-none uppercase"
      >
        PESQUISAR
      </div>
    </button>
  );
};

export default memo(VadeMecumSearchBar);
