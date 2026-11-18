import React from 'react';
import { ArrowLeft, Globe, History as HistoryIcon, Sparkles } from 'lucide-react';
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
      className="flex items-center justify-between px-3.5 py-2.5 shrink-0 bg-[#0d0408]/85 backdrop-blur-2xl border-b border-rose-950/60"
      style={{ paddingTop: 'calc(var(--sai-top,env(safe-area-inset-top,0px)) + 0.5rem)' }}
    >
      {/* Botão de Voltar Padronizado Premium (48x48dp+) */}
      <button
        onClick={() => {
          haptic.light();
          onClose();
          setTimeout(newSession, 300);
        }}
        aria-label="Voltar"
        className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-[#18070d] hover:bg-[#250c14] active:scale-95 transition-all shadow-md z-10 border border-rose-500/30 text-rose-100"
      >
        <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
      </button>

      {/* Título Central & Toggle da Internet */}
      <div className="flex flex-col items-center z-10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span className="font-serif font-bold text-[16px] sm:text-[17px] text-rose-100 tracking-wide">
            Tutor Jurídico
          </span>
        </div>

        {/* Toggle Elegante da Internet */}
        <button
          onClick={() => {
            haptic.selection();
            if (!podeUsarPremium) {
              setGateFeature('chat_juridico');
            } else {
              toggleWebSearch();
            }
          }}
          className={`flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full transition-all active:scale-95 border shadow-sm ${
            webSearch && podeUsarPremium
              ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
              : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {webSearch && podeUsarPremium ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500" />
            )}
          </span>
          <Globe className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
            {webSearch && podeUsarPremium ? 'Pesquisa Web' : 'Base Offline'}
          </span>
        </button>
      </div>

      {/* Botão de Histórico Padronizado */}
      <button
        onClick={() => {
          haptic.selection();
          setHistoryOpen(true);
        }}
        aria-label="Histórico de conversas"
        className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-[#18070d] hover:bg-[#250c14] active:scale-95 transition-all shadow-md z-10 border border-rose-500/30 text-rose-100"
      >
        <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.2} />
      </button>
    </header>
  );
};
