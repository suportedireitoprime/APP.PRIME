import React from 'react';
import { X, Globe, History as HistoryIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface AssistenteMobileHeaderProps {
  onClose: () => void;
  newSession: () => void;
  podeUsarPremium: boolean;
  setGateFeature: (f: any) => void;
  toggleWebSearch: () => void;
  webSearch: boolean;
  setHistoryOpen: (open: boolean) => void;
}

export const AssistenteMobileHeader: React.FC<AssistenteMobileHeaderProps> = ({
  onClose,
  newSession,
  podeUsarPremium,
  setGateFeature,
  toggleWebSearch,
  webSearch,
  setHistoryOpen,
}) => {
  return (
    <header
      className="flex items-center justify-between px-3.5 py-2.5 shrink-0 bg-zinc-950/40 backdrop-blur-xl border-b border-white/5"
      style={{ paddingTop: 'calc(var(--sai-top,env(safe-area-inset-top,0px)) + 0.5rem)' }}
    >
      <button
        onClick={() => {
          haptic.light();
          onClose();
          setTimeout(newSession, 300);
        }}
        aria-label="Fechar"
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-zinc-900/80 hover:bg-zinc-800 active:scale-90 transition-all shadow-md z-10 border border-white/10"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" strokeWidth={2.2} />
      </button>

      <div className="flex flex-col items-center z-10">
        <span className="text-[14px] sm:text-[15px] font-semibold text-foreground tracking-wide">
          Chat Jurídico
        </span>
        <button
          onClick={() => {
            haptic.selection();
            if (!podeUsarPremium) {
              setGateFeature('chat_juridico');
            } else {
              toggleWebSearch();
            }
          }}
          className="flex items-center gap-1.5 mt-0.5 px-3 py-1 rounded-full transition-all active:scale-95 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 shadow-sm"
        >
          <Globe
            className={`w-3.5 h-3.5 ${
              webSearch && podeUsarPremium ? 'text-accent' : 'text-muted-foreground'
            }`}
          />
          <span
            className={`text-[9px] font-bold uppercase tracking-widest ${
              webSearch && podeUsarPremium ? 'text-accent' : 'text-muted-foreground'
            }`}
          >
            Internet
          </span>
          <div
            className={`relative w-7 h-4 rounded-full flex items-center transition-colors shadow-inner ${
              webSearch && podeUsarPremium ? 'bg-accent' : 'bg-muted'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform shadow-sm ${
                webSearch && podeUsarPremium ? 'translate-x-[14px]' : 'translate-x-[2px]'
              }`}
            />
          </div>
        </button>
      </div>

      <button
        onClick={() => {
          haptic.selection();
          setHistoryOpen(true);
        }}
        aria-label="Histórico"
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-zinc-900/80 hover:bg-zinc-800 active:scale-90 transition-all shadow-md z-10 border border-white/10"
      >
        <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" strokeWidth={2} />
      </button>
    </header>
  );
};
