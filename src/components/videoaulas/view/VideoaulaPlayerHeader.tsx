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
  areaLabel?: string;
  canal?: string;
  concluida?: boolean;
}

export const VideoaulaPlayerHeader = memo(function VideoaulaPlayerHeader({
  tempo,
  displayDuracao,
  pctAtual,
  tituloLimpo,
  areaLabel,
  canal,
  concluida,
}: VideoaulaPlayerHeaderProps) {
  return (
    <>
      <div
        id="videoaula-placeholder"
        className="relative w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] lg:w-full -mx-2 sm:-mx-4 lg:mx-0 bg-transparent aspect-video lg:rounded-2xl lg:overflow-hidden"
      >
        <div className="absolute inset-0 bg-black/10 animate-pulse pointer-events-none" />
      </div>

      <div className="px-3 lg:px-0 space-y-2.5 pt-1">
        {/* Barra de Progresso do Vídeo */}
        <div className="h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${pctAtual}%` }}
          />
        </div>

        {/* Linha de Metadados: Categoria, Tempo e Canal */}
        <div className="flex items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            {areaLabel && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/25 whitespace-nowrap">
                {areaLabel}
              </span>
            )}
            {canal && (
              <span className="text-[11.5px] text-zinc-400 truncate hidden sm:inline">
                {canal}
              </span>
            )}
            {concluida && (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                ✓ Concluída
              </span>
            )}
          </div>
          <div className="tabular-nums font-semibold text-[11.5px] text-zinc-400 shrink-0">
            <span>{formatTempo(tempo)}</span>
            <span className="text-zinc-600 mx-1">/</span>
            <span>{displayDuracao > 0 ? formatTempo(displayDuracao) : '--:--'}</span>
          </div>
        </div>

        {/* Título com Nova Tipografia Moderna e Alta Legibilidade */}
        <h1
          style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          className="text-[16px] sm:text-[19px] lg:text-[21px] font-bold leading-snug text-white tracking-normal"
        >
          {tituloLimpo}
        </h1>
      </div>
    </>
  );
});
