import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clapperboard, Play } from 'lucide-react';
import animacoesCatalogRaw from '@/data/animacoesCatalog.json';
import {
  type AnimacaoItem,
  formatAnimacaoTitulo,
  formatAreaCurta,
  getAreaBadgeStyle,
} from '@/data/animacoesTypes';
import HomeSectionHeader from '@/components/vademecum/home/sections/HomeSectionHeader';
import { useAnimacoesVistas } from '@/hooks/useAnimacoesInteracoes';
import { haptic } from '@/lib/nativeHaptics';
import { prefetchRoute } from '@/lib/routePrefetch';

const animacoesCatalog = animacoesCatalogRaw as AnimacaoItem[];

export const HomeAnimacoesCarousel: React.FC = React.memo(function HomeAnimacoesCarousel() {
  const navigate = useNavigate();
  const { vistasSet } = useAnimacoesVistas();

  if (!animacoesCatalog || animacoesCatalog.length === 0) return null;

  const destaques = animacoesCatalog.slice(0, 14);

  return (
    <section className="flex flex-col gap-3">
      <HomeSectionHeader
        title="ANIMAÇÕES JURÍDICAS"
        actionLabel="Ver todas"
        onAction={() => {
          haptic.selection();
          navigate('/animacoes');
        }}
      />

      <div className="flex items-start gap-3 overflow-x-auto pb-1 no-scrollbar snap-x -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-4 sm:px-6 md:px-8 lg:px-12">
        {destaques.map((item, idx) => {
          const tituloLimpo = formatAnimacaoTitulo(item.tituloHtml || item.titulo);
          const areaStyle = getAreaBadgeStyle(item.categoria);
          const vista = vistasSet.has(item.slug);
          return (
            <button
              key={item.slug}
              type="button"
              onPointerEnter={() => prefetchRoute('animacoes')}
              onClick={() => {
                haptic.selection();
                navigate(`/animacoes/${item.slug}`);
              }}
              className="group w-[134px] sm:w-[154px] snap-start flex flex-col gap-2 text-left shrink-0 active:scale-[0.97] transition-transform"
            >
              {/* Capa estilo livro (proporção 7:10) */}
              <div className="relative w-full aspect-[7/10] rounded-xl overflow-hidden bg-zinc-900 border border-white/15 group-hover:border-red-500/60 shadow-xl shadow-black/70 transition-all">
                {item.capaR2Url ? (
                  <img
                    src={item.capaR2Url}
                    alt={tituloLimpo}
                    loading={idx < 4 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-cover brightness-110 contrast-105 saturate-125 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-red-950/50 via-zinc-900 to-zinc-950 text-center gap-2">
                    <Clapperboard className="w-7 h-7 text-red-500" />
                    <span className="text-[11px] font-bold text-white line-clamp-3">
                      {tituloLimpo}
                    </span>
                  </div>
                )}

                <span
                  style={areaStyle}
                  className="absolute top-2 left-2 truncate px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider w-fit max-w-[calc(100%-64px)] shadow-sm"
                >
                  {formatAreaCurta(item.categoria)}
                </span>

                {vista ? (
                  <span
                    className="absolute top-2 right-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 border border-emerald-400/50 text-[9px] font-bold uppercase tracking-wider text-emerald-300 shadow-sm"
                    title="Você já assistiu"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Visto</span>
                  </span>
                ) : (
                  <span
                    style={{ backgroundColor: '#10B981', color: '#09090B' }}
                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider shadow-sm"
                  >
                    NOVO
                  </span>
                )}

                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-black/50 group-hover:scale-110 transition-transform">
                  <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                </div>
              </div>

              <div className="px-0.5 space-y-0.5">
                <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                  {tituloLimpo}
                </h3>
                <p className="text-[10px] text-muted-foreground truncate">
                  {item.artigoRef || item.exameRef || formatAreaCurta(item.categoria)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
});

export default HomeAnimacoesCarousel;
