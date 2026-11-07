import React, { memo, useMemo, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';
import type { VideoaulaAreaItem } from './VideoaulasAreaCard';
import constCover from '@/assets/biblioteca/areas/direito-constitucional.webp';

interface VideoaulasEmAltaCarouselProps {
  areas: VideoaulaAreaItem[];
  onSelectArea: (slug: string) => void;
}

const PRIORIDADE = [
  'Direito Constitucional',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito Administrativo',
  'Direito do Trabalho',
  'Direito Processual do Trabalho',
  'Direito Tributário',
  'Direitos Humanos',
  'Direito Empresarial',
  'Direito Previdenciário',
  'Direito Ambiental',
  'Direito Eleitoral',
];

const STORAGE_FAV_AREAS_KEY = 'videoaulas_fav_areas_v1';

export const VideoaulasEmAltaCarousel: React.FC<VideoaulasEmAltaCarouselProps> = memo(
  function VideoaulasEmAltaCarousel({ areas, onSelectArea }) {
    const [favAreas, setFavAreas] = useState<Set<string>>(() => {
      try {
        const raw = localStorage.getItem(STORAGE_FAV_AREAS_KEY);
        if (raw) return new Set(JSON.parse(raw));
      } catch {}
      return new Set();
    });

    const toggleFav = (areaNome: string, e: React.MouseEvent) => {
      e.stopPropagation();
      haptic.impact();
      setFavAreas((prev) => {
        const next = new Set(prev);
        if (next.has(areaNome)) {
          next.delete(areaNome);
          toast.info(`"${simplificarNomeArea(areaNome)}" removido dos favoritos.`);
        } else {
          next.add(areaNome);
          toast.success(`"${simplificarNomeArea(areaNome)}" adicionado aos favoritos!`);
        }
        try {
          localStorage.setItem(STORAGE_FAV_AREAS_KEY, JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });
    };

    const areasOrdenadas = useMemo(() => {
      if (!areas || areas.length === 0) return [];

      const copy = [...areas].sort((a, b) => {
        const idxA = PRIORIDADE.indexOf(a.area);
        const idxB = PRIORIDADE.indexOf(b.area);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return b.total - a.total;
      });

      return copy.slice(0, 12);
    }, [areas]);

    // Pré-carrega as capas em memória para exibição a 0ms
    useEffect(() => {
      areasOrdenadas.forEach((item) => {
        const coverData = getAreaCover(item.area);
        const url = coverData?.cover || constCover;
        if (url) {
          const img = new Image();
          img.src = url;
        }
      });
    }, [areasOrdenadas]);

    if (areasOrdenadas.length === 0) return null;

    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0 flex-1">
            <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
              <span className="w-1 h-5 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">EM ALTA</span>
            </h3>
            <p className="text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3">
              Matérias e videoaulas fundamentais para sua formação e concursos
            </p>
          </div>
        </div>

        {/* Carrossel Fluido com snap horizontal */}
        <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
          {areasOrdenadas.map((item, idx) => {
            const coverData = getAreaCover(item.area);
            const coverUrl = coverData?.cover || constCover;
            const isFav = favAreas.has(item.area);
            const displayTitle = simplificarNomeArea(item.area);

            return (
              <div
                key={`em-alta-${item.slug}`}
                onClick={() => {
                  haptic.selection();
                  onSelectArea(item.slug);
                }}
                className="snap-start shrink-0 w-[128px] sm:w-[142px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-95 transition-transform duration-150"
              >
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-rose-500/50 transition-all shadow-md group-hover:shadow-rose-950/40">
                  <img
                    src={coverUrl}
                    alt={displayTitle}
                    loading={idx < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                  {/* Badge de progresso */}
                  {item.pct > 0 && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-[9px] font-black text-white shadow">
                      {item.pct}%
                    </span>
                  )}

                  {/* Botão de Favorito no topo direito */}
                  <button
                    type="button"
                    onClick={(e) => toggleFav(item.area, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/70 hover:text-rose-400 hover:scale-110 active:scale-90 transition-all z-10 cursor-pointer"
                    aria-label="Favoritar área"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                  </button>
                </div>

                <p className="font-sans font-bold text-xs sm:text-[13px] text-white group-hover:text-rose-300 transition-colors line-clamp-2 mt-2 leading-snug">
                  {displayTitle}
                </p>
                <p className="text-[10.5px] text-white/50 truncate mt-0.5">
                  {item.total} {item.total === 1 ? 'aula disponível' : 'aulas disponíveis'}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
);

