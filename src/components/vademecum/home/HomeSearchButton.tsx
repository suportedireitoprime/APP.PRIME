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
      role="button"
      aria-haspopup="dialog"
      aria-label={isOffline ? "Pesquisar leis e artigos no catálogo offline do Vade Mecum" : "Pesquisar leis, códigos e artigos no Vade Mecum"}
      className="mt-auto relative w-full flex items-center h-[60px] sm:h-16 pl-11 sm:pl-14 pr-[94px] sm:pr-[102px] rounded-2xl bg-black/75 backdrop-blur-sm border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine cursor-pointer"
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 pointer-events-none" strokeWidth={2.2} />
      
      <div className="flex items-center gap-1.5 min-w-0 flex-1 text-left overflow-hidden">
        {isOffline && (
          <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/25 border border-amber-400/40 text-amber-300 text-[10px] font-bold animate-fade-in pointer-events-none">
            <WifiOff className="w-3 h-3 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Offline</span>
          </span>
        )}
        <span className="relative z-[2] font-body text-white/75 text-[14px] sm:text-[15px] font-medium truncate text-left pointer-events-none">
          <TypingHint />
        </span>
      </div>

      <div 
        aria-hidden="true"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 sm:h-12 px-3.5 sm:px-4.5 rounded-xl bg-gradient-to-tr from-[#3a0308] via-[#7a0816] to-[#b81829] text-white font-display text-[12px] sm:text-[13px] font-bold tracking-wide flex items-center justify-center pointer-events-none select-none uppercase"
      >
        PESQUISAR
      </div>
    </button>
  );
};

export default memo(HomeSearchButton);
