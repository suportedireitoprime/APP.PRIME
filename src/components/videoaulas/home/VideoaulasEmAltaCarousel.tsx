import React, { memo, useMemo, useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { simplificarNomeArea } from '@/lib/videoaulasCatalogos';
import type { VideoaulaAreaItem } from './VideoaulasAreaCard';

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

    // Pré-carrega as capas em memória para exibição instantânea (0ms)
    useEffect(() => {
      areasOrdenadas.forEach((item) => {
        const tema = getDisciplinaVisualTheme(item.slug || item.area);
        const url = tema.fundoAssetUrl;
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
              <span className="w-1.5 h-4.5 rounded-full bg-zinc-400 shrink-0" />
              <span>Em Alta</span>
            </h3>
            <p className="text-zinc-400 text-xs sm:text-[13px] leading-snug ml-3.5 mt-0.5">
              Matérias fundamentais para sua formação e concursos
            </p>
          </div>
        </div>

        {/* Carrossel Fluido com snap horizontal */}
        <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
          {areasOrdenadas.map((item, idx) => {
            const tema = getDisciplinaVisualTheme(item.slug || item.area);
            const coverUrl = tema.fundoAssetUrl;
            const isFav = favAreas.has(item.area);
            const displayTitle = simplificarNomeArea(item.area).replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '');

            return (
              <div
                key={`em-alta-${item.slug}`}
                onClick={() => {
                  haptic.selection();
                  onSelectArea(item.slug);
                }}
                className="snap-start shrink-0 w-[130px] sm:w-[145px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-95 transition-transform duration-150 touch-manipulation"
              >
                <div className="relative aspect-[3/4.1] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-white/30 transition-all shadow-md">
                  <img
                    src={coverUrl}
                    alt={displayTitle}
                    loading={idx < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                  {/* Badge de progresso */}
                  {item.pct > 0 && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-[9.5px] font-black text-white shadow">
                      {item.pct}%
                    </span>
                  )}

                  {/* Botão de Favorito no topo direito com alvo de toque Google 44px */}
                  <button
                    type="button"
                    onClick={(e) => toggleFav(item.area, e)}
                    aria-label={`Favoritar ${item.area}`}
                    className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/15 text-white/80 active:scale-90 transition-transform cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isFav ? 'fill-rose-500 text-rose-500' : 'hover:text-white'
                      }`}
                    />
                  </button>

                  {/* Título DENTRO da Capa com degradê elegante */}
                  <div className="absolute bottom-0 inset-x-0 p-2.5 pt-4 text-left pointer-events-none">
                    <p className="font-sans font-bold text-xs sm:text-[13px] text-white leading-tight line-clamp-2 drop-shadow-md">
                      {displayTitle}
                    </p>
                    <span className="text-[10px] text-zinc-400 font-medium leading-none block mt-1 font-sans">
                      {item.total} aulas
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
);
