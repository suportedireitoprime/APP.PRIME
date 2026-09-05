import React, { memo } from 'react';

export function formatTempo(s: number) {
  if (!s || !isFinite(s)) return '0:00';
  const t = Math.floor(s);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

interface VideoaulaPlayerHeaderProps {
  tempo: number;
  displayDuracao: number;
  pctAtual: number;
  tituloLimpo: string;
}

export const VideoaulaPlayerHeader = memo(function VideoaulaPlayerHeader({
  tempo,
  displayDuracao,
  pctAtual,
  tituloLimpo,
}: VideoaulaPlayerHeaderProps) {
  return (
    <>
      <div
        id="videoaula-placeholder"
        className="relative w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] lg:w-full -mx-2 sm:-mx-4 lg:mx-0 bg-transparent aspect-video lg:rounded-2xl lg:overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10 animate-pulse pointer-events-none" />
      </div>

      <div className="px-3 lg:px-0 space-y-2">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${pctAtual}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[12px] text-muted-foreground tabular-nums">
          <span>{formatTempo(tempo)}</span>
          <span>{displayDuracao > 0 ? formatTempo(displayDuracao) : '--:--'}</span>
        </div>
        <h1 className="text-[17px] sm:text-xl lg:text-2xl font-bold leading-snug text-foreground">
          {tituloLimpo}
        </h1>
      </div>
    </>
  );
});
