import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clapperboard,
  FileText,
  Maximize2,
  Play,
  RotateCcw,
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string>('Todas');
  const [reloadKey, setReloadKey] = useState(0);
  const [mostrarTexto, setMostrarTexto] = useState(true);

  const ativa = useMemo(
    () => (slug ? animacoesCatalog.find((a) => a.slug === slug) || null : null),
    [slug]
  );

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return animacoesCatalog.filter((item) => {
      if (categoria !== 'Todas' && item.categoria !== categoria) return false;
      if (!q) return true;
      return (
        item.titulo.toLowerCase().includes(q) ||
        (item.tituloHtml || '').toLowerCase().includes(q) ||
        (item.artigoRef || '').toLowerCase().includes(q) ||
        (item.exameRef || '').toLowerCase().includes(q) ||
        item.resumo.toLowerCase().includes(q)
      );
    });
  }, [busca, categoria]);

  const abrirTelaCheia = () => {
    const el = iframeRef.current;
    if (!el) return;
    haptic.selection();
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

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

      <main className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] space-y-6">
        {/* Header minimalista */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
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
              <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
                {ativa ? ativa.tituloHtml || ativa.titulo : 'Animações Jurídicas'}
              </h1>
              <p className="text-xs text-zinc-400 truncate">
                {ativa
                  ? `${ativa.categoria}${ativa.gabarito ? ` • Gabarito ${ativa.gabarito}` : ''}`
                  : `${animacoesCatalog.length} casos animados com áudio no R2`}
              </p>
            </div>
          </div>

          {ativa && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setReloadKey((k) => k + 1);
                }}
                title="Reiniciar animação"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={abrirTelaCheia}
                title="Tela cheia"
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-200 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </header>

        {/* Visualizador da Animação Selecionada */}
        {ativa ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 space-y-3">
              <div className="relative w-full aspect-video min-h-[360px] sm:min-h-[480px] rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                <iframe
                  key={`${ativa.slug}_${reloadKey}`}
                  ref={iframeRef}
                  src={ativa.htmlR2Url}
                  title={ativa.tituloHtml || ativa.titulo}
                  allow="autoplay; fullscreen"
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
                    <FileText className="w-4 h-4" />
                    <span>Sobre o Caso</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarTexto((v) => !v)}
                    className="text-xs text-zinc-400 hover:text-white lg:hidden"
                  >
                    {mostrarTexto ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>

                {ativa.gabarito && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-300">
                    Gabarito: {ativa.gabarito}
                  </div>
                )}

                {mostrarTexto && (
                  <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {ativa.tratamentoMd || ativa.resumo || 'Material de apoio desta animação.'}
                  </div>
                )}
              </div>
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
                  placeholder="Buscar animação por caso, artigo ou prova (ex: OAB, CP art. 2º, legítima defesa)..."
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

                      {item.resumo && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.resumo}
                        </p>
                      )}
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
