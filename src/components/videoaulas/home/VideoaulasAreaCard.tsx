import React from 'react';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';
import { areaIconFor } from '@/lib/areasDireitoIcons';

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
  const { Icon, color } = areaIconFor(area.slug || area.area);
  const pct = Math.min(100, Math.max(0, area.pct || 0));

  return (
    <button
      type="button"
      onClick={() => {
        haptic.selection();
        onClick(area.slug);
      }}
      style={{ touchAction: 'pan-y' }}
      className="w-full flex items-center justify-between gap-3.5 p-3.5 sm:p-4 min-h-[76px] text-left bg-[#252528] hover:bg-[#2F2F33] border border-white/5 hover:border-white/10 shadow-sm active:scale-[0.99] transition-all rounded-2xl group overflow-hidden relative cursor-pointer touch-pan-y"
    >
      {/* Container com Ícone Colorido */}
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 bg-white/[0.04] border border-white/5 transition-transform duration-300 group-hover:scale-105 z-10">
        <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6" style={{ color }} strokeWidth={1.8} />
      </div>

      {/* Textos da Matéria e Barra de Progresso */}
      <div className="flex-1 min-w-0 pr-1 z-10">
        <h4 className="font-sans font-normal text-[15px] sm:text-[16px] text-white/95 group-hover:text-white transition-colors leading-snug tracking-normal truncate">
          {displayArea}
        </h4>
        <p className="font-sans text-[11px] sm:text-[11.5px] font-light leading-tight mt-0.5 text-zinc-400 truncate">
          {area.total} {area.total === 1 ? 'videoaula' : 'videoaulas'}
          {area.concluidas ? ` · ${area.concluidas} concluída${area.concluidas > 1 ? 's' : ''}` : ''}
        </p>

        {/* Barra de progresso para contabilizar */}
        <div className="flex items-center gap-2 mt-2 max-w-[200px] w-full">
          <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <span className="font-sans text-[10.5px] text-zinc-400 font-light shrink-0 leading-none">
            {pct}%
          </span>
        </div>
      </div>

      {/* Seta Neutra à Direita */}
      <ChevronRight
        className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 z-10 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all stroke-[1.8]"
      />
    </button>
  );
};
