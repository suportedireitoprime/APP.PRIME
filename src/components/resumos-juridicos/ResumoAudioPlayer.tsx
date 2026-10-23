import React, { useRef, useState } from "react";
import { Play, Pause, RotateCcw, RotateCw, Headphones, Volume2, VolumeX, Sparkles } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";
import { cn } from "@/lib/utils";
import { useResumoAudio } from "./useResumoAudio";

interface ResumoAudioPlayerProps {
  audioUrl?: string | null;
  titulo?: string;
  subtitulo?: string;
  className?: string;
  compact?: boolean;
  controller?: ReturnType<typeof useResumoAudio>;
}

export function ResumoAudioPlayer({
  audioUrl,
  titulo = "Narração do Resumo",
  subtitulo,
  className,
  compact = false,
  controller: externalController,
}: ResumoAudioPlayerProps) {
  // Se não foi passado controller externo, instancia internamente
  const internalController = useResumoAudio({
    audioUrl: externalController ? undefined : audioUrl,
    titulo,
    subtitulo,
  });

  const c = externalController ?? internalController;
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSeek = (clientX: number) => {
    const bar = progressBarRef.current;
    if (!bar || !c.duration) return;

    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    c.seekTo(pos * c.duration);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleSeek(moveEvent.clientX);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleSeek(e.touches[0].clientX);

    const onTouchMove = (moveEvent: TouchEvent) => {
      handleSeek(moveEvent.touches[0].clientX);
    };

    const onTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };

    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#121316]/95 backdrop-blur-md px-3.5 py-3 sm:px-4 sm:py-3.5 text-white shadow-xl transition-all select-none not-prose",
        className
      )}
    >
      {/* Luz ambiente de fundo sutil */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-xl"
        style={{
          background: "radial-gradient(circle, #E11D48 0%, transparent 70%)",
        }}
      />

      {/* Linha 1: Botão Play/Pause + Título + Ações Rápidas */}
      <div className="flex items-center gap-3">
        {/* Botão Play / Pause Compacto & Tátil */}
        <button
          type="button"
          onClick={c.togglePlay}
          aria-label={c.isPlaying ? "Pausar narração" : "Reproduzir narração"}
          className="relative w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#E11D48] to-[#F43F5E] text-white shadow-md shadow-[#E11D48]/30 hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          {c.isPlaying ? (
            <Pause className="w-5 h-5 fill-white text-white" />
          ) : (
            <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
          )}
          {c.isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E11D48]" />
            </span>
          )}
        </button>

        {/* Informações Centrais: Título + Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E11D48] shrink-0">
              Narração do Resumo
            </span>
            {c.isPlaying && (
              <div className="flex items-end gap-0.5 h-2.5 shrink-0">
                <span className="w-0.5 h-2 bg-[#E11D48] animate-pulse rounded-full" />
                <span className="w-0.5 h-3 bg-[#E11D48] animate-pulse delay-75 rounded-full" />
                <span className="w-0.5 h-1.5 bg-[#E11D48] animate-pulse delay-150 rounded-full" />
              </div>
            )}
          </div>
          <p className="text-xs sm:text-[13px] font-semibold text-foreground truncate mt-0.5">
            {titulo}
          </p>
        </div>

        {/* Controles rápidos alinhados à direita */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => c.skipSeconds(-10)}
            aria-label="Voltar 10 segundos"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white transition-all text-[10px] font-mono"
            title="Voltar 10 segundos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => c.skipSeconds(10)}
            aria-label="Avançar 10 segundos"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white transition-all text-[10px] font-mono"
            title="Avançar 10 segundos"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={c.cycleSpeed}
            aria-label="Velocidade de reprodução"
            className="px-1.5 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 active:opacity-70 text-[10.5px] font-mono font-bold text-white/90 border border-white/10 transition-all"
          >
            {c.playbackRate}x
          </button>
          <button
            type="button"
            onClick={c.toggleMute}
            aria-label={c.isMuted ? "Desmutar áudio" : "Mutar áudio"}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 active:opacity-70 text-white/70 hover:text-white transition-all"
          >
            {c.isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Linha 2: Barra de Progresso e Tempos */}
      <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/5">
        <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-8 text-right">
          {formatTime(c.currentTime)}
        </span>
        <div
          ref={progressBarRef}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className="relative h-1.5 sm:h-2 flex-1 rounded-full bg-white/10 cursor-pointer overflow-hidden group py-0.5"
        >
          <div
            className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-[#E11D48] to-[#FB7185] transition-all"
            style={{ width: `${c.progressPct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-8">
          {formatTime(c.duration)}
        </span>
      </div>
    </div>
  );
}
