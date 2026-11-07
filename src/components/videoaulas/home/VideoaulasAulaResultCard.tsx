import React from 'react';
import { ChevronRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';
import { ytThumb, limparTitulo } from '@/lib/videoaulasCatalogos';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import type { AulaHit } from '@/types/videoaula';
import constCover from '@/assets/biblioteca/areas/direito-constitucional.webp';

interface VideoaulasAulaResultCardProps {
  aula: AulaHit;
}

export const VideoaulasAulaResultCard: React.FC<VideoaulasAulaResultCardProps> = ({ aula }) => {
  const navigate = useNavigate();
  const coverUrl = ytThumb(aula.videoId, 'hq') || getAreaCover(aula.area)?.cover || constCover;
  const tituloLimpo = limparTitulo(aula.titulo);

  return (
    <button
      onClick={() => {
        haptic.selection();
        navigate(`/videoaulas/${aula.catalogoId}/${aula.slugArea || 'aulas'}/${aula.videoId}`);
      }}
      className="w-full flex items-center gap-3.5 p-3 sm:p-4 min-h-[88px] text-left hover:bg-white/[0.04] active:scale-[0.985] transition-all rounded-2xl bg-[#141416]/90 border border-white/10 hover:border-rose-500/40 shadow-md group overflow-hidden relative cursor-pointer"
    >
      <div className="w-[58px] h-[78px] sm:w-[64px] sm:h-[84px] shrink-0 rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-lg relative flex items-center justify-center">
        <img
          src={coverUrl}
          alt={tituloLimpo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow">
            <Play className="w-3 h-3 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-sans font-bold text-base sm:text-[17px] text-white group-hover:text-rose-300 transition-colors leading-snug line-clamp-2">
          {tituloLimpo}
        </h4>
        <p className="font-sans text-xs sm:text-[13px] text-white/50 leading-tight mt-1.5 flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span className="truncate">{aula.area}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 group-hover:bg-rose-600 group-hover:border-rose-500 group-hover:text-white transition-all duration-200 shrink-0 text-xs font-bold tracking-wider uppercase">
        <span>Assistir</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
};

