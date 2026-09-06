import React, { memo } from 'react';
import {
  LayoutGrid,
  Target,
  Loader2,
  Square,
  Mic,
  Volume2,
  Pause,
  StickyNote,
  X,
  Feather,
} from 'lucide-react';
import { RING_CIRCUMFERENCE } from '../useArtigoNarracao';

interface ArtigoBottomBarProps {
  highlightMode: boolean;
  voiceGrifoActive: boolean;
  setShowEraseSheet: (v: boolean) => void;
  activeActionMenu: 'funcoes' | 'grifar' | null;
  setActiveActionMenu: (v: 'funcoes' | 'grifar' | null) => void;
  isPremium: boolean;
  openPremiumGate: (feature: any) => void;
  setShowPraticarSheet: (v: boolean) => void;
  voicePhase: 'idle' | 'recording' | 'processing';
  voicePanelRef: React.RefObject<any>;
  setVoiceGrifoActive: (v: boolean) => void;
  toggleMode: () => void;
  handleNarrarButtonPress: (e: React.SyntheticEvent) => void;
  narracaoLoading: boolean;
  narracaoPlaying: boolean;
  narracaoUrl?: string | null;
  narracaoRingRef: React.RefObject<SVGCircleElement>;
  setShowAnotacoesSheet: (v: boolean) => void;
  setShowFontControls: (v: boolean) => void;
  anotacoesCount: number;
  magicMode: boolean;
  magicLoading: boolean;
  highlightsCount: number;
}

export const ArtigoBottomBar = memo(function ArtigoBottomBar({
  highlightMode,
  voiceGrifoActive,
  setShowEraseSheet,
  activeActionMenu,
  setActiveActionMenu,
  isPremium,
  openPremiumGate,
  setShowPraticarSheet,
  voicePhase,
  voicePanelRef,
  setVoiceGrifoActive,
  toggleMode,
  handleNarrarButtonPress,
  narracaoLoading,
  narracaoPlaying,
  narracaoUrl,
  narracaoRingRef,
  setShowAnotacoesSheet,
  setShowFontControls,
  anotacoesCount,
  magicMode,
  magicLoading,
  highlightsCount,
}: ArtigoBottomBarProps) {
  return (
    <div className="shrink-0 relative z-[55] bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/80 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.6)] pb-[max(1.75rem,calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px))))]">
      <div className="relative grid grid-cols-5 items-end px-2 py-1 max-w-lg mx-auto">
        {highlightMode || voiceGrifoActive ? (
          <button
            onClick={() => setShowEraseSheet(true)}
            className="flex flex-col items-center justify-end gap-1.5 py-1.5 text-zinc-300 hover:text-red-400 transition-colors"
          >
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            <span className="font-body text-[11px] sm:text-[12px] leading-tight">Apagar</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveActionMenu('funcoes')}
            className={`flex flex-col items-center justify-end gap-1 py-2 transition-colors ${
              activeActionMenu === 'funcoes' ? 'text-primary' : 'text-zinc-300 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-body text-[11px] sm:text-[12px] leading-tight">Funções</span>
          </button>
        )}

        {highlightMode || voiceGrifoActive ? (
          <div aria-hidden="true" />
        ) : (
          <button
            onClick={() => {
              if (!isPremium) {
                openPremiumGate('praticar');
                return;
              }
              setShowPraticarSheet(true);
            }}
            className="flex flex-col items-center justify-end gap-1 py-2 text-zinc-300 hover:text-white transition-colors"
          >
            <Target className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-body text-[11px] sm:text-[12px] leading-tight">Praticar</span>
          </button>
        )}

        {/* FAB central: Narrar por padrão; vira gravador quando Grifar por voz está ativo */}
        {voiceGrifoActive ? (
          <button
            onClick={() => {
              if (voicePhase === 'recording') voicePanelRef.current?.stop();
              else if (voicePhase === 'idle') voicePanelRef.current?.start();
            }}
            disabled={voicePhase === 'processing'}
            className="relative z-[80] flex flex-col items-center justify-end gap-1 py-2 touch-manipulation select-none"
            aria-label={voicePhase === 'recording' ? 'Parar gravação' : 'Gravar voz'}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 invisible" aria-hidden="true" />
            <div className="absolute bottom-[28px] sm:bottom-[32px] pointer-events-none">
              <span
                className={`relative w-[4rem] h-[4rem] sm:w-[4.5rem] sm:h-[4.5rem] rounded-full flex items-center justify-center shadow-lg ring-4 ring-zinc-900 transition-all duration-300 pointer-events-auto ${
                  voicePhase === 'recording'
                    ? 'bg-red-500 shadow-red-500/40 scale-105'
                    : voicePhase === 'processing'
                    ? 'bg-secondary'
                    : 'bg-primary shadow-primary/40'
                }`}
              >
                {voicePhase === 'recording' && (
                  <>
                    <span
                      className="absolute inset-0 rounded-full bg-red-500/40 animate-ping"
                      style={{ animationDuration: '1.2s' }}
                    />
                    <span
                      className="absolute -inset-1 rounded-full bg-red-500/20 animate-ping"
                      style={{ animationDuration: '1.8s', animationDelay: '0.2s' }}
                    />
                  </>
                )}
                {voicePhase === 'processing' ? (
                  <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-foreground animate-spin relative z-20" />
                ) : voicePhase === 'recording' ? (
                  <Square className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white relative z-20" />
                ) : (
                  <Mic className="w-8 h-8 sm:w-9 sm:h-9 text-black relative z-20" />
                )}
              </span>
            </div>
            <span className="font-body text-[11px] sm:text-[12px] font-semibold text-primary leading-tight">
              {voicePhase === 'recording'
                ? 'Parar'
                : voicePhase === 'processing'
                ? 'Analisando'
                : 'Gravar'}
            </span>
          </button>
        ) : (
          <button
            onPointerDown={handleNarrarButtonPress}
            onTouchStart={handleNarrarButtonPress}
            onClick={handleNarrarButtonPress}
            disabled={narracaoLoading}
            className="relative z-[80] flex flex-col items-center justify-end gap-1 py-2 touch-manipulation select-none"
            aria-label="Narrar"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 invisible" aria-hidden="true" />
            <div className="absolute bottom-[28px] sm:bottom-[32px] pointer-events-none">
              <span
                className={`relative w-[4rem] h-[4rem] sm:w-[4.5rem] sm:h-[4.5rem] rounded-full flex items-center justify-center shadow-lg ring-4 ring-zinc-900 transition-all duration-300 pointer-events-auto ${
                  narracaoPlaying
                    ? 'bg-primary shadow-primary/40 scale-105'
                    : 'bg-primary shadow-primary/30 hover:bg-primary/90'
                }`}
              >
                {narracaoPlaying && (
                  <>
                    <span
                      className="absolute inset-0 rounded-full bg-primary/30 animate-ping"
                      style={{ animationDuration: '1.5s' }}
                    />
                    <span
                      className="absolute -inset-1 rounded-full bg-primary/15 animate-ping"
                      style={{ animationDuration: '2s', animationDelay: '0.3s' }}
                    />
                  </>
                )}
                {narracaoPlaying && (
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90 z-10 pointer-events-none"
                    viewBox="0 0 56 56"
                  >
                    <circle
                      cx="28"
                      cy="28"
                      r="26"
                      fill="none"
                      stroke="hsl(var(--primary-foreground))"
                      strokeWidth="3"
                      strokeOpacity="0.2"
                    />
                    <circle
                      ref={narracaoRingRef}
                      cx="28"
                      cy="28"
                      r="26"
                      fill="none"
                      stroke="hsl(var(--primary-foreground))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${RING_CIRCUMFERENCE}`}
                      strokeDashoffset={`${RING_CIRCUMFERENCE}`}
                    />
                  </svg>
                )}
                {narracaoLoading ? (
                  <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground animate-spin relative z-20" />
                ) : narracaoPlaying ? (
                  <Pause className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground relative z-20" />
                ) : (
                  <Volume2 className="w-8 h-8 sm:w-9 sm:h-9 text-primary-foreground relative z-20" />
                )}
              </span>
            </div>
            <span className="font-body text-[11px] sm:text-[12px] font-semibold text-primary leading-tight">
              {narracaoPlaying ? 'Pausar' : narracaoUrl ? 'Ouvir' : 'Narrar'}
            </span>
          </button>
        )}

        {highlightMode || voiceGrifoActive ? (
          <div aria-hidden="true" />
        ) : (
          <button
            onClick={() => {
              if (!isPremium) {
                openPremiumGate('anotacoes');
                return;
              }
              setShowAnotacoesSheet(true);
              setShowFontControls(false);
            }}
            className="relative flex flex-col items-center justify-end gap-1 py-2 text-zinc-300 hover:text-white transition-colors"
          >
            <span className="relative">
              <StickyNote className="w-7 h-7 sm:w-8 sm:h-8" />
              {anotacoesCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center leading-none shadow-md ring-2 ring-zinc-900">
                  {anotacoesCount > 99 ? '99+' : anotacoesCount}
                </span>
              )}
            </span>
            <span className="font-body text-[11px] sm:text-[12px] leading-tight">Anotações</span>
          </button>
        )}

        {highlightMode || voiceGrifoActive ? (
          <button
            onClick={() => {
              if (voiceGrifoActive) {
                try {
                  voicePanelRef.current?.stop();
                } catch {}
                setVoiceGrifoActive(false);
              } else {
                toggleMode();
              }
            }}
            className="flex flex-col items-center justify-end gap-1.5 py-1.5 text-primary hover:text-primary-light transition-colors"
          >
            <X className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-body text-[11px] sm:text-[12px] font-semibold leading-tight">
              Fechar
            </span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (!isPremium) {
                openPremiumGate('grifo');
                return;
              }
              setActiveActionMenu('grifar');
            }}
            className={`relative flex flex-col items-center justify-end gap-1 py-2 transition-colors ${
              activeActionMenu === 'grifar' || magicMode || highlightMode
                ? 'text-primary'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <span className="relative">
              <Feather className={`w-7 h-7 sm:w-8 sm:h-8 ${magicLoading ? 'animate-spin' : ''}`} />
              {highlightsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center leading-none shadow-md ring-2 ring-card">
                  {highlightsCount > 99 ? '99+' : highlightsCount}
                </span>
              )}
            </span>
            <span className="font-body text-[11px] sm:text-[12px] leading-tight">Grifar</span>
          </button>
        )}
      </div>
    </div>
  );
});
