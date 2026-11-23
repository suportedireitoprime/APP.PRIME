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
      className="w-full flex items-center gap-3 p-2.5 sm:p-3 min-h-[74px] text-left hover:bg-white/[0.04] active:scale-[0.99] transition-all rounded-xl sm:rounded-2xl bg-zinc-950/50 hover:bg-zinc-900/60 border border-white/[0.06] hover:border-white/15 shadow-sm group overflow-hidden relative cursor-pointer backdrop-blur-sm"
    >
      <div className="w-[52px] h-[70px] sm:w-[58px] sm:h-[76px] shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-black/50 border border-white/[0.08] shadow relative flex items-center justify-center">
        <img
          src={coverUrl}
          alt={tituloLimpo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center shadow backdrop-blur-xs border border-white/20">
            <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="font-sans font-normal text-[13.5px] sm:text-[14.5px] text-white/90 group-hover:text-white transition-colors leading-snug line-clamp-2 tracking-normal">
          {tituloLimpo}
        </h4>
        <p className="font-sans font-light text-[11px] sm:text-[11.5px] text-white/40 leading-tight mt-1 flex items-center gap-1.5 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80 shrink-0" />
          <span className="truncate">{aula.area}</span>
        </p>
      </div>

      {/* Seta Minimalista e Elegante */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/[0.03] text-white/35 group-hover:text-white group-hover:bg-white/[0.08] flex items-center justify-center shrink-0 transition-all duration-200">
        <ChevronRight className="w-4 h-4 stroke-[1.6]" />
      </div>
    </button>
  );
};

