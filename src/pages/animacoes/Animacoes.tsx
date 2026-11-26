import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clapperboard,
  Play,
  Search,
  Volume2,
  X,
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import animacoesCatalogRaw from '@/data/animacoesCatalog.json';
import type { AnimacaoItem } from '@/data/animacoesTypes';
import { useIsDesktop } from '@/hooks/use-desktop';
import { haptic } from '@/lib/nativeHaptics';
import { resetGlobalScroll } from '@/lib/scrollUtils';

const animacoesCatalog = animacoesCatalogRaw as AnimacaoItem[];

const CATEGORIAS = ['Todas', 'OAB', 'Código Penal', 'Concursos'] as const;

const Animacoes: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isDesktop = useIsDesktop();

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string>('Todas');
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);

  const ativa = useMemo(
    () => (slug ? animacoesCatalog.find((a) => a.slug === slug) || null : null),
    [slug]
  );

  useEffect(() => {
    setIframeHeight(null);
  }, [slug]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'animacao-resize' && typeof e.data.height === 'number') {
        setIframeHeight(Math.max(520, Math.ceil(e.data.height)));
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return animacoesCatalog.filter((item) => {
      if (categoria !== 'Todas' && item.categoria !== categoria) return false;
      if (!q) return true;
      return (
        item.titulo.toLowerCase().includes(q) ||
        (item.tituloHtml || '').toLowerCase().includes(q) ||
        (item.artigoRef || '').toLowerCase().includes(q) ||
        (item.exameRef || '').toLowerCase().includes(q)
      );
    });
  }, [busca, categoria]);

  return (
    <div
      className={`w-full bg-zinc-950 text-foreground relative overflow-x-hidden ${
        isDesktop
          ? 'rounded-2xl pb-12 min-h-[700px] border border-white/5'
          : 'min-h-screen pb-[calc(6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]'
      }`}
    >
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <main
        className={`relative z-10 max-w-[1440px] mx-auto pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] ${
          ativa ? 'px-0 sm:px-6 space-y-3 sm:space-y-4' : 'px-4 sm:px-6 space-y-6'
        }`}
      >
        {/* Header minimalista */}
        <header className={`flex items-center gap-3 ${ativa ? 'px-3 sm:px-0' : ''}`}>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              if (ativa) {
                navigate('/animacoes');
              } else {
                resetGlobalScroll();
                navigate('/');
              }
            }}
            aria-label={ativa ? 'Voltar para lista de animações' : 'Voltar para início'}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold text-white tracking-tight truncate">
              {ativa ? ativa.tituloHtml || ativa.titulo : 'Animações Jurídicas'}
            </h1>
            <p className="text-xs text-zinc-400 truncate">
              {ativa
                ? `${ativa.categoria}${ativa.artigoRef ? ` • ${ativa.artigoRef}` : ''}${ativa.gabarito ? ` • Gabarito ${ativa.gabarito}` : ''}`
                : `${animacoesCatalog.length} casos animados`}
            </p>
          </div>
        </header>

        {/* Visualizador Minimalista Full-Bleed */}
        {ativa ? (
          <div className="w-full flex justify-center">
            <div className="relative w-full sm:max-w-[460px] overflow-hidden bg-zinc-950 sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl">
              <iframe
                key={ativa.slug}
                src={`${ativa.htmlR2Url}?v=5`}
                title={ativa.tituloHtml || ativa.titulo}
                allow="autoplay; fullscreen"
                scrolling="no"
                style={iframeHeight ? { height: `${iframeHeight}px` } : undefined}
                className="w-full h-[calc(100vw*1.778+96px)] sm:h-[860px] border-0 block overflow-hidden bg-zinc-950"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Busca + Categorias */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar animação por caso, artigo ou prova (ex: OAB, CP art. 4º)..."
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIAS.map((cat) => {
                  const ativo = categoria === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setCategoria(cat);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-all ${
                        ativo
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid de Animações */}
            {filtradas.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-sm text-zinc-400">
                Nenhuma animação encontrada para essa busca.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filtradas.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      navigate(`/animacoes/${item.slug}`);
                    }}
                    className="group flex flex-col justify-between p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-amber-500/40 text-left transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          {item.categoria}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-amber-500/15 group-hover:bg-amber-500 text-amber-300 group-hover:text-zinc-950 flex items-center justify-center transition-colors shrink-0">
                          <Play className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>

                      <h2 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2">
                        {item.tituloHtml || item.titulo}
                      </h2>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-white/10 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1.5 truncate">
                        <Clapperboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          {item.artigoRef || item.exameRef || 'Caso jurídico'}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.gabarito && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                            Gab {item.gabarito}
                          </span>
                        )}
                        {item.totalAudios > 0 && (
                          <span className="flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>{item.totalAudios}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Animacoes;
