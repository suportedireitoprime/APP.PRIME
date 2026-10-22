import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  BookOpen,
  Volume2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/nativeHaptics";
import type { NarracaoItem } from "./audioleiTypes";

interface AudioleiBottomDockProps {
  currentArtigo: NarracaoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  leiNome: string;
  leiSigla: string;
  capaUrl: string;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSkipTime: (deltaSeconds: number) => void;
  onChangeSpeed: (speed: number) => void;
  onClose: () => void;
  onOpenVadeMecum?: (artigoNum: string) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export const AudioleiBottomDock: React.FC<AudioleiBottomDockProps> = ({
  currentArtigo,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  leiNome,
  leiSigla,
  capaUrl,
  onTogglePlay,
  onSeek,
  onSkipTime,
  onChangeSpeed,
  onClose,
  onOpenVadeMecum,
}) => {
  if (!currentArtigo) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const speeds = [1, 1.25, 1.5, 2];

  const handleNextSpeed = () => {
    haptic.selection();
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    onChangeSpeed(speeds[nextIdx]);
  };

  const handleScrubber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetSeconds = (val / 100) * duration;
    onSeek(targetSeconds);
  };

  return (
    <aside aria-label="Miniplayer de reprodução de áudio" className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] pointer-events-none">
      <div className="max-w-4xl mx-auto rounded-3xl bg-[#121214]/95 border border-primary/30 shadow-2xl shadow-black/80 backdrop-blur-xl p-3 sm:p-4 pointer-events-auto transition-all">
        {/* Barra fina de progresso no topo do dock */}
        <div className="relative mb-2 flex items-center">
          <input
            type="range"
            min={0}
            max={100}
            value={progressPercent}
            onChange={handleScrubber}
            aria-label="Progresso da reprodução"
            className="w-full h-1.5 bg-secondary/80 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Lado Esquerdo: Capa e Título do Artigo */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-900 shadow-sm">
              <img
                src={capaUrl}
                alt={leiSigla}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-primary rounded-full animate-[bounce_0.8s_infinite] h-2.5" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite] h-3" />
                    <span className="w-0.5 bg-primary rounded-full animate-[bounce_1s_infinite] h-1.5" />
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                  Artigo {currentArtigo.artigo_numero}
                </span>
                <span className="text-[10px] text-primary font-mono font-bold shrink-0">
                  • {leiSigla}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                {currentArtigo.titulo_artigo || leiNome}
              </p>
              <div className="text-[10px] text-muted-foreground font-mono tabular-nums flex items-center gap-1">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Controles de Áudio */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Velocidade */}
            <button
              type="button"
              onClick={handleNextSpeed}
              title="Velocidade"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold bg-secondary/80 hover:bg-secondary text-foreground border border-border"
            >
              <Zap className="w-3 h-3 text-primary" />
              <span>{playbackRate}x</span>
            </button>

            {/* Voltar 15s */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onSkipTime(-15);
              }}
              title="Voltar 15s"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/80 hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => {
                haptic.impact();
                onTogglePlay();
              }}
              title={isPlaying ? "Pausar" : "Tocar"}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30 active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Avançar 15s */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onSkipTime(15);
              }}
              title="Avançar 15s"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/80 hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Ler no Vade Mecum */}
            {onOpenVadeMecum && (
              <button
                type="button"
                onClick={() => onOpenVadeMecum(currentArtigo.artigo_numero)}
                title="Ler texto no Vade Mecum"
                className="hidden sm:flex w-9 h-9 rounded-xl bg-secondary/80 hover:bg-white/10 text-muted-foreground hover:text-foreground items-center justify-center active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            )}

            {/* Fechar Dock */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              title="Fechar player"
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 flex items-center justify-center ml-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
