import React, { memo } from "react";
import {
  GraduationCap,
  Lightbulb,
  FileDown,
  Type,
  Volume2,
  Pause,
  Play,
  Loader2,
  Minus,
  Plus,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { haptic } from "@/lib/nativeHaptics";

export const RESUMO_RING_CIRCUMFERENCE = 2 * Math.PI * 26; // ~163.36

export type MetodoResumo = "conceitos" | "cornell" | "feynman";

interface ResumoBottomBarProps {
  metodo: MetodoResumo;
  onSelectMetodo: (metodo: MetodoResumo) => void;
  temCornell?: boolean;
  temFeynman?: boolean;
  gerandoMetodo?: MetodoResumo | null;
  audioUrl?: string | null;
  audioPlaying: boolean;
  audioLoading: boolean;
  audioProgress: number; // 0 a 100
  onToggleAudio: () => void;
  onBaixarPdf: () => void;
  salvandoPdf: boolean;
  fontSize: number;
  onIncFont: () => void;
  onDecFont: () => void;
  fontOpen: boolean;
  onToggleFont: () => void;
}

export const ResumoBottomBar = memo(function ResumoBottomBar({
  metodo,
  onSelectMetodo,
  temCornell,
  temFeynman,
  gerandoMetodo,
  audioUrl,
  audioPlaying,
  audioLoading,
  audioProgress,
  onToggleAudio,
  onBaixarPdf,
  salvandoPdf,
  fontSize,
  onIncFont,
  onDecFont,
  fontOpen,
  onToggleFont,
}: ResumoBottomBarProps) {
  const dashOffset =
    RESUMO_RING_CIRCUMFERENCE - (RESUMO_RING_CIRCUMFERENCE * Math.min(100, Math.max(0, audioProgress))) / 100;

  const handleMetodoClick = (alvo: "cornell" | "feynman") => {
    haptic.selection();
    if (metodo === alvo) {
      onSelectMetodo("conceitos");
    } else {
      onSelectMetodo(alvo);
    }
  };

  const handleAudioPress = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!audioUrl) return;
    haptic.selection();
    onToggleAudio();
  };

  const handlePdfClick = () => {
    haptic.selection();
    onBaixarPdf();
  };

  const handleFontClick = () => {
    haptic.selection();
    onToggleFont();
  };

  return (
    <div className="shrink-0 relative z-[55] bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800/80 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.6)] transition-[padding] duration-200 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] select-none">
      {/* Menu flutuante de ajuste de fonte */}
      <AnimatePresence>
        {fontOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="absolute bottom-[calc(100%+12px)] right-4 flex items-center bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-full shadow-2xl p-1 z-[60]"
          >
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onDecFont();
              }}
              aria-label="Diminuir fonte"
              className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-200 hover:bg-zinc-800 active:scale-90 transition-all"
            >
              <Minus className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <span className="min-w-[48px] text-center text-xs font-mono font-bold tabular-nums text-white">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onIncFont();
              }}
              aria-label="Aumentar fonte"
              className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-200 hover:bg-zinc-800 active:scale-90 transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative grid grid-cols-5 items-end px-2 py-1 max-w-lg mx-auto">
        {/* Slot 1: Método Cornell */}
        <button
          type="button"
          onClick={() => handleMetodoClick("cornell")}
          className={`flex flex-col items-center justify-end gap-1 py-2 transition-colors touch-manipulation ${
            metodo === "cornell" ? "text-[#38bdf8]" : "text-zinc-300 hover:text-white"
          }`}
          aria-label="Método Cornell"
          title="Método Cornell"
        >
          <span className="relative">
            {gerandoMetodo === "cornell" ? (
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-[#38bdf8]" />
            ) : (
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
            )}
            {temCornell && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#38bdf8] ring-2 ring-zinc-900" />
            )}
          </span>
          <span className="font-body text-[11px] sm:text-[12px] leading-tight font-medium">
            Cornell
          </span>
        </button>

        {/* Slot 2: Método Feynman */}
        <button
          type="button"
          onClick={() => handleMetodoClick("feynman")}
          className={`flex flex-col items-center justify-end gap-1 py-2 transition-colors touch-manipulation ${
            metodo === "feynman" ? "text-[#fbbf24]" : "text-zinc-300 hover:text-white"
          }`}
          aria-label="Método Feynman"
          title="Método Feynman"
        >
          <span className="relative">
            {gerandoMetodo === "feynman" ? (
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-[#fbbf24]" />
            ) : (
              <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8" />
            )}
            {temFeynman && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#fbbf24] ring-2 ring-zinc-900" />
            )}
          </span>
          <span className="font-body text-[11px] sm:text-[12px] leading-tight font-medium">
            Feynman
          </span>
        </button>

        {/* Slot 3: FAB Central - Narrar */}
        <button
          type="button"
          onPointerDown={handleAudioPress}
          onClick={handleAudioPress}
          disabled={!audioUrl || audioLoading}
          className={`relative z-[80] flex flex-col items-center justify-end gap-1 py-2 touch-manipulation select-none ${
            !audioUrl && !audioLoading ? "opacity-60" : ""
          }`}
          aria-label={
            audioPlaying ? "Pausar narração" : audioUrl ? "Ouvir narração" : "Sem áudio disponível"
          }
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 invisible" aria-hidden="true" />
          <div className="absolute bottom-[28px] sm:bottom-[32px] pointer-events-none">
            <span
              className={`relative w-[4rem] h-[4rem] sm:w-[4.5rem] sm:h-[4.5rem] rounded-full flex items-center justify-center shadow-lg ring-4 ring-zinc-900 transition-all duration-300 pointer-events-auto ${
                audioPlaying
                  ? "bg-[#E11D48] shadow-[#E11D48]/40 scale-105"
                  : audioUrl
                  ? "bg-[#E11D48] shadow-[#E11D48]/30 hover:bg-[#E11D48]/90 active:scale-95"
                  : "bg-zinc-800 text-zinc-400 shadow-none ring-zinc-800/80"
              }`}
            >
              {/* Efeito de onda quando tocando */}
              {audioPlaying && (
                <>
                  <span
                    className="absolute inset-0 rounded-full bg-[#E11D48]/40 animate-ping"
                    style={{ animationDuration: "1.5s" }}
                  />
                  <span
                    className="absolute -inset-1 rounded-full bg-[#E11D48]/20 animate-ping"
                    style={{ animationDuration: "2s", animationDelay: "0.3s" }}
                  />
                </>
              )}

              {/* Anel de progresso circular SVG */}
              {audioUrl && (
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90 z-10 pointer-events-none"
                  viewBox="0 0 56 56"
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="26"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  {audioPlaying && (
                    <circle
                      cx="28"
                      cy="28"
                      r="26"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeDasharray={`${RESUMO_RING_CIRCUMFERENCE}`}
                      strokeDashoffset={`${dashOffset}`}
                      style={{ transition: "stroke-dashoffset 0.25s linear" }}
                    />
                  )}
                </svg>
              )}

              {audioLoading ? (
                <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-white animate-spin relative z-20" />
              ) : audioPlaying ? (
                <Pause className="w-8 h-8 sm:w-9 sm:h-9 text-white fill-white relative z-20" />
              ) : audioUrl ? (
                <Volume2 className="w-8 h-8 sm:w-9 sm:h-9 text-white relative z-20" />
              ) : (
                <Volume2 className="w-8 h-8 sm:w-9 sm:h-9 text-zinc-500 relative z-20 opacity-60" />
              )}
            </span>
          </div>
          <span
            className={`font-body text-[11px] sm:text-[12px] font-semibold leading-tight ${
              audioUrl ? "text-[#E11D48]" : "text-zinc-500"
            }`}
          >
            {audioPlaying ? "Pausar" : audioUrl ? "Ouvir" : "Sem áudio"}
          </span>
        </button>

        {/* Slot 4: Baixar PDF */}
        <button
          type="button"
          onClick={handlePdfClick}
          disabled={salvandoPdf}
          className="flex flex-col items-center justify-end gap-1 py-2 text-zinc-300 hover:text-white transition-colors touch-manipulation disabled:opacity-50"
          aria-label="Baixar resumo em PDF"
          title="Baixar em PDF"
        >
          {salvandoPdf ? (
            <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-[#E11D48]" />
          ) : (
            <FileDown className="w-7 h-7 sm:w-8 sm:h-8" />
          )}
          <span className="font-body text-[11px] sm:text-[12px] leading-tight font-medium">
            PDF
          </span>
        </button>

        {/* Slot 5: Ajustar Fonte */}
        <button
          type="button"
          onClick={handleFontClick}
          className={`flex flex-col items-center justify-end gap-1 py-2 transition-colors touch-manipulation ${
            fontOpen ? "text-[#E11D48]" : "text-zinc-300 hover:text-white"
          }`}
          aria-label="Tamanho da fonte"
          title="Tamanho da fonte"
        >
          <Type className="w-7 h-7 sm:w-8 sm:h-8" />
          <span className="font-body text-[11px] sm:text-[12px] leading-tight font-medium">
            Fonte
          </span>
        </button>
      </div>
    </div>
  );
});
