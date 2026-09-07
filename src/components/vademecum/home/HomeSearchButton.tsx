import { memo, useState, useEffect } from 'react';
import { Search, WifiOff } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import TypingHint from './TypingHint';

interface HomeSearchButtonProps {
  onOpenSearch: () => void;
}

const HomeSearchButton = ({ onOpenSearch }: HomeSearchButtonProps) => {
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClick = () => {
    haptic.light();
    onOpenSearch();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isOffline ? "Pesquisar leis e artigos no catálogo offline do Vade Mecum" : "Pesquisar leis, códigos e artigos no Vade Mecum"}
      className="mt-auto relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/75 backdrop-blur-sm border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine"
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary shrink-0" strokeWidth={2.2} />
      <span className="relative z-[2] font-body text-white/70 text-[15px] font-medium truncate text-left">
        <TypingHint />
      </span>
      {isOffline && (
        <span className="absolute right-[116px] top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10.5px] font-medium z-10 animate-fade-in">
          <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Offline</span>
        </span>
      )}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/30 active:scale-95 transition">
        PESQUISAR
      </div>
    </button>
  );
};

export default memo(HomeSearchButton);
