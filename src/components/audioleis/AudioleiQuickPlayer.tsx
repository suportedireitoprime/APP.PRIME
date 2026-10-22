import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  SkipBack,
  SkipForward,
  BookOpen,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/nativeHaptics";

export interface NarracaoItem {
  artigo_numero: string;
  audio_url: string;
  titulo_artigo?: string;
  word_timings?: unknown;
}

interface AudioleiQuickPlayerProps {
  currentArtigo: NarracaoItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  leiNome: string;
  leiSigla: string;
  totalAudios: number;
  capaUrl: string;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onSkipTime: (deltaSeconds: number) => void;
  onChangeSpeed: (speed: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onOpenVadeMecum?: (artigoNum: string) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export const AudioleiQuickPlayer: React.FC<AudioleiQuickPlayerProps> = ({
  currentArtigo,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  leiNome,
  leiSigla,
  totalAudios,
  capaUrl,
  onTogglePlay,
  onSeek,
  onSkipTime,
  onChangeSpeed,
  onPrevious,
  onNext,
  onOpenVadeMecum,
}) => {
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const speeds = [1, 1.25, 1.5, 2];

  const handleNextSpeed = () => {
    haptic.selection();
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    onChangeSpeed(speeds[nextIdx]);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const targetSeconds = (val / 100) * duration;
    onSeek(targetSeconds);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-card via-card/95 to-secondary/30 border border-primary/25 shadow-xl shadow-black/40 backdrop-blur-md p-4 sm:p-6 transition-all">
      {/* Luz ambiente de fundo */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabeçalho do Card: Informações da Lei e Status */}
      <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 border border-white/15 shadow-md shadow-black/40 bg-zinc-900">
            <img
              src={capaUrl}
              alt={leiSigla}
              loading="eager"
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                <span className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-primary rounded-full animate-[bounce_0.8s_infinite] h-3" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite] h-4" />
                  <span className="w-1 bg-primary rounded-full animate-[bounce_1s_infinite] h-2" />
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold tracking-wider uppercase">
                <Sparkles className="w-3 h-3" />
                <span>Audiolei Oficial</span>
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {totalAudios} artigos gravados
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-foreground truncate mt-0.5">
              {currentArtigo
                ? `Artigo ${currentArtigo.artigo_numero} • ${leiSigla}`
                : `${leiNome} (${leiSigla})`}
            </h2>

            <p className="text-xs text-muted-foreground line-clamp-1">
              {currentArtigo?.titulo_artigo ||
                "Selecione qualquer artigo abaixo para tocar instantaneamente"}
            </p>
          </div>
        </div>

        {/* Botão de Velocidade Rápida no Topo */}
        <button
          type="button"
          onClick={handleNextSpeed}
          title="Clique para alternar velocidade (1x, 1.25x, 1.5x, 2x)"
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-mono font-bold border border-border hover:border-primary/50 transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span>{playbackRate}x</span>
        </button>
      </div>

      {/* Scrubber / Barra de Progresso */}
      <div className="relative z-10 space-y-1.5 mb-4">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={100}
            value={progressPercent}
            onChange={handleScrubberChange}
            aria-label="Progresso do áudio"
            className="w-full h-2 bg-secondary/80 rounded-full appearance-none cursor-pointer accent-primary focus:outline-none transition-all"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${progressPercent}%, rgba(255,255,255,0.1) ${progressPercent}%)`,
            }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span className="text-[10px] text-muted-foreground/80 uppercase font-sans tracking-wide">
            {isPlaying ? "Reproduzindo narração" : currentArtigo ? "Pausado" : "Pronto para escuta"}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles Principais de Alta Eficiência */}
      <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
        {/* Ler no Vade Mecum */}
        {currentArtigo && onOpenVadeMecum ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenVadeMecum(currentArtigo.artigo_numero)}
            className="h-10 px-3 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 active:scale-95 transition"
            title="Abrir texto da lei no Vade Mecum"
          >
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Ver Letra da Lei</span>
          </Button>
        ) : (
          <div className="w-10 sm:w-28" />
        )}

        {/* Bloco Central de Controles de Áudio */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voltar 15s */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onSkipTime(-15);
            }}
            title="Voltar 15 segundos"
            className="relative w-10 h-10 rounded-xl bg-secondary/80 hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="absolute -bottom-1 text-[8px] font-bold font-mono">15</span>
          </button>

          {/* Artigo Anterior */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onPrevious();
            }}
            title="Artigo Anterior"
            className="w-10 h-10 rounded-xl bg-secondary/80 hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          {/* PLAY / PAUSE GIGANTE CENTRAL */}
          <button
            type="button"
            onClick={() => {
              haptic.impact();
              onTogglePlay();
            }}
            title={isPlaying ? "Pausar" : "Tocar"}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/35 hover:shadow-primary/50 transition-all duration-200 active:scale-95 cursor-pointer ring-4 ring-primary/20"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
            )}
          </button>

          {/* Próximo Artigo */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onNext();
            }}
            title="Próximo Artigo"
            className="w-10 h-10 rounded-xl bg-secondary/80 hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          {/* Avançar 15s */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onSkipTime(15);
            }}
            title="Avançar 15 segundos"
            className="relative w-10 h-10 rounded-xl bg-secondary/80 hover:bg-white/10 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span className="absolute -bottom-1 text-[8px] font-bold font-mono">15</span>
          </button>
        </div>

        {/* Indicador de Status / Atalho */}
        <div className="hidden sm:flex items-center justify-end w-28 text-right">
          <span className="text-[11px] text-muted-foreground font-mono">
            {currentArtigo ? `Art. ${currentArtigo.artigo_numero}` : `${leiSigla}`}
          </span>
        </div>
      </div>
    </div>
  );
};
