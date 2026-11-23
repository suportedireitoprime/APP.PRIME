import React from 'react';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { simplificarNomeArea, getCapaDaArea } from '@/lib/videoaulasCatalogos';

export interface VideoaulaAreaItem {
  area: string;
  slug: string;
  total: number;
  concluidas?: number;
  pct: number;
  displayArea?: string;
}

interface VideoaulasAreaCardProps {
  area: VideoaulaAreaItem;
  onClick: (slug: string) => void;
}

export const VideoaulasAreaCard: React.FC<VideoaulasAreaCardProps> = ({ area, onClick }) => {
  if (!area) return null;
  const displayArea = simplificarNomeArea(area.area || '').replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '');
  const coverUrl = getCapaDaArea(area.area || area.slug);

  return (
    <button
      type="button"
      onClick={() => {
        haptic.selection();
        onClick(area.slug);
      }}
      style={{ touchAction: 'pan-y' }}
      className="w-full flex items-center gap-3 p-2.5 sm:p-3 min-h-[74px] text-left hover:bg-white/[0.04] active:scale-[0.99] transition-all rounded-xl sm:rounded-2xl bg-zinc-950/50 hover:bg-zinc-900/60 border border-white/[0.06] hover:border-white/15 shadow-sm group overflow-hidden relative cursor-pointer touch-pan-y backdrop-blur-sm"
    >
      {/* Capa da Matéria de Aulas Interativas */}
      <div className="w-12 sm:w-14 aspect-[3/4] shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-black/50 border border-white/[0.08] shadow relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <img
          src={coverUrl}
          alt={displayArea}
          className="w-full h-full object-cover pointer-events-none select-none"
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-constitucional.webp';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        {area.pct > 0 && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-[8px] font-medium text-white font-sans">
            {area.pct}%
          </span>
        )}
      </div>

      {/* Textos da Matéria */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-sans font-normal text-[14.5px] sm:text-[15.5px] text-white/95 group-hover:text-white transition-colors leading-snug tracking-normal">
          {displayArea}
        </h4>
        <p className="font-sans font-light text-[11px] sm:text-[11.5px] text-white/40 leading-tight mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
          <span>
            {area.total} {area.total === 1 ? 'videoaula disponível' : 'videoaulas disponíveis'}
          </span>
        </p>

        {area.pct > 0 && (
          <div className="w-full bg-white/10 h-0.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${area.pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Seta Minimalista e Elegante */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/[0.03] text-white/35 group-hover:text-white group-hover:bg-white/[0.08] flex items-center justify-center shrink-0 transition-all duration-200">
        <ChevronRight className="w-4 h-4 stroke-[1.6]" />
      </div>
    </button>
  );
};
