import { memo } from 'react';
import { Search } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import TypingHint from './TypingHint';

interface HomeSearchButtonProps {
  onOpenSearch: () => void;
}

const HomeSearchButton = ({ onOpenSearch }: HomeSearchButtonProps) => {
  const handleClick = () => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    onOpenSearch();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Pesquisar artigos e leis"
      className="mt-auto relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/45 backdrop-blur-md border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine"
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary shrink-0" strokeWidth={2.2} />
      <span className="relative z-[2] font-body text-white/70 text-[15px] font-medium truncate text-left">
        <TypingHint />
      </span>
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/30 active:scale-95 transition">
        PESQUISAR
      </div>
    </button>
  );
};

export default memo(HomeSearchButton);
