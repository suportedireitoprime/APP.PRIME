import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Play } from 'lucide-react';
import animacoesHomeRaw from '@/data/animacoesHomeCatalog.json';
import {
  type AnimacaoHomeItem,
  formatAnimacaoTitulo,
  formatAreaCurta,
} from '@/data/animacoesTypes';
import HomeSectionHeader from '@/components/vademecum/home/sections/HomeSectionHeader';
import { useAnimacoesVistas } from '@/hooks/useAnimacoesVistas';
import { haptic } from '@/lib/nativeHaptics';
import { prefetchRoute } from '@/lib/routePrefetch';

const animacoesHome = animacoesHomeRaw as AnimacaoHomeItem[];

export const HomeAnimacoesCarousel: React.FC = React.memo(function HomeAnimacoesCarousel() {
  const navigate = useNavigate();
  const { vistasSet } = useAnimacoesVistas();

  if (!animacoesHome || animacoesHome.length === 0) return null;

  const destaques = animacoesHome.slice(0, 14);

  return (
    <section
      className="flex flex-col gap-3"
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 290px' }}
    >
      <HomeSectionHeader
        title="ANIMAÇÕES JURÍDICAS"
        actionLabel="Ver todas"
        onAction={() => {
          haptic.selection();
          navigate('/animacoes');
        }}
      />

      <div className="flex items-start gap-3 overflow-x-auto overscroll-x-contain touch-pan-x touch-pan-y pb-1 no-scrollbar snap-x -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-4 sm:px-6 md:px-8 lg:px-12">
        {destaques.map((item, idx) => {
          const tituloLimpo = formatAnimacaoTitulo(item.tituloHtml || item.titulo);
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
              <div className="relative w-full aspect-[7/10] rounded-xl overflow-hidden bg-zinc-900 border border-white/15 group-hover:border-red-500/60 shadow-sm">
                {(item.capaThumbR2Url || item.capaR2Url) ? (
                  <img
                    src={item.capaThumbR2Url || item.capaR2Url || ''}
                    alt={tituloLimpo}
                    width={154}
                    height={220}
                    loading={idx < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-gradient-to-br from-red-950/50 via-zinc-900 to-zinc-950 text-center gap-2">
                    <Clapperboard className="w-7 h-7 text-red-500" />
                    <span className="text-[11px] font-bold text-white line-clamp-3">
                      {tituloLimpo}
                    </span>
                  </div>
                )}

                {!vista && (
                  <span
                    style={{ backgroundColor: '#10B981', color: '#09090B' }}
                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider"
                  >
                    NOVO
                  </span>
                )}

                <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
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
