import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Play, Volume2, ChevronRight } from 'lucide-react';
import animacoesCatalogRaw from '@/data/animacoesCatalog.json';
import type { AnimacaoItem } from '@/data/animacoesTypes';
import HomeSectionHeader from '@/components/vademecum/home/sections/HomeSectionHeader';
import { haptic } from '@/lib/nativeHaptics';
import { prefetchRoute } from '@/lib/routePrefetch';

const animacoesCatalog = animacoesCatalogRaw as AnimacaoItem[];

export const HomeAnimacoesCarousel: React.FC = React.memo(function HomeAnimacoesCarousel() {
  const navigate = useNavigate();

  if (!animacoesCatalog || animacoesCatalog.length === 0) return null;

  const destaques = animacoesCatalog.slice(0, 12);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <HomeSectionHeader title="ANIMAÇÕES JURÍDICAS" />
        <button
          type="button"
          onPointerEnter={() => prefetchRoute('animacoes')}
          onClick={() => {
            haptic.selection();
            navigate('/animacoes');
          }}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 shrink-0 transition-colors"
        >
          <span>Ver todas ({animacoesCatalog.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-stretch gap-3 overflow-x-auto pb-1 no-scrollbar snap-x">
        {destaques.map((item) => (
          <button
            key={item.slug}
            type="button"
            onPointerEnter={() => prefetchRoute('animacoes')}
            onClick={() => {
              haptic.selection();
              navigate(`/animacoes/${item.slug}`);
            }}
            className="group min-w-[235px] max-w-[235px] sm:min-w-[260px] sm:max-w-[260px] snap-start flex flex-col justify-between p-3.5 rounded-2xl bg-card hover:bg-secondary/60 border border-border/60 hover:border-amber-500/40 shadow-sm hover:shadow-lg active:scale-[0.98] transition-all text-left shrink-0"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {item.categoria}
                </span>
                <div className="w-8 h-8 rounded-full bg-amber-500/15 group-hover:bg-amber-500 text-amber-300 group-hover:text-zinc-950 flex items-center justify-center transition-colors shrink-0">
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </div>
              </div>

              <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                {item.tituloHtml || item.titulo}
              </h3>

              {item.resumo && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.resumo}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-border/40 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 truncate">
                <Clapperboard className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{item.artigoRef || item.exameRef || 'Caso animado'}</span>
              </span>
              {item.totalAudios > 0 && (
                <span className="flex items-center gap-1 text-zinc-400 shrink-0">
                  <Volume2 className="w-3 h-3 text-amber-400" />
                  <span>{item.totalAudios}</span>
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
});

export default HomeAnimacoesCarousel;
