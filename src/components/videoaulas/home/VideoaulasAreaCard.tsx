import React from 'react';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';

export interface VideoaulaAreaItem {
  area: string;
  slug: string;
  total: number;
  concluidas?: number;
  pct: number;
}

interface VideoaulasAreaCardProps {
  area: VideoaulaAreaItem;
  onClick: (slug: string) => void;
}

export const VideoaulasAreaCard: React.FC<VideoaulasAreaCardProps> = ({ area, onClick }) => {
  const displayArea = simplificarNomeArea(area.area).replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '');
  const tema = getDisciplinaVisualTheme(area.slug || area.area);
  const coverUrl = tema.fundoAssetUrl;

  return (
    <button
      type="button"
      onClick={() => {
        haptic.selection();
        onClick(area.slug);
      }}
      className="w-full flex items-center gap-3.5 p-3 sm:p-4 min-h-[84px] text-left hover:bg-white/[0.04] active:scale-[0.985] transition-all rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-white/20 shadow-md group overflow-hidden relative cursor-pointer touch-manipulation backdrop-blur-md"
    >
      {/* Capa da Matéria de Aulas Interativas */}
      <div className="w-14 sm:w-16 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-lg relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <img
          src={coverUrl}
          alt={displayArea}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        {area.pct > 0 && (
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-[8.5px] font-black text-white font-sans">
            {area.pct}%
          </span>
        )}
      </div>

      {/* Textos da Matéria */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-sans font-bold text-base sm:text-[17px] text-white group-hover:text-zinc-200 transition-colors leading-snug">
          {displayArea}
        </h4>
        <p className="font-sans text-xs sm:text-[13px] text-zinc-400 leading-tight mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
          <span>
            {area.total} {area.total === 1 ? 'videoaula disponível' : 'videoaulas disponíveis'}
          </span>
        </p>

        {area.pct > 0 && (
          <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${area.pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Seta Suave e Minimalista */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 text-zinc-400 group-hover:text-white group-hover:bg-white/10 flex items-center justify-center shrink-0 transition-all duration-200">
        <ChevronRight className="w-5 h-5" />
      </div>
    </button>
  );
};
