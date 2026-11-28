import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clapperboard,
  Heart,
  MessageSquare,
  Play,
  Search,
  Send,
  Share2,
  Star,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import animacoesCatalogRaw from '@/data/animacoesCatalog.json';
import type { AnimacaoItem } from '@/data/animacoesTypes';
import { getAreaBadgeClass } from '@/data/animacoesTypes';
import { useIsDesktop } from '@/hooks/use-desktop';
import { useAnimacoesInteracoes } from '@/hooks/useAnimacoesInteracoes';
import { haptic } from '@/lib/nativeHaptics';
import { resetGlobalScroll } from '@/lib/scrollUtils';

const animacoesCatalog = animacoesCatalogRaw as AnimacaoItem[];

type AbaPainel = 'comentarios' | 'resumo' | 'ranking';
type OrdenacaoLista = 'padrao' | 'ranking' | 'comentarios';

function formatTitulo(titulo: string) {
  return titulo.replace(/\s*[—–]\s*/g, ': ');
}

function formatAreaCurta(categoria: string) {
  return categoria.replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '').trim() || categoria;
}

function formatarDataCurta(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const Animacoes: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isDesktop = useIsDesktop();

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string>('Todas');
  const [tema, setTema] = useState<string>('Todos');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoLista>('padrao');
  const [abaPainel, setAbaPainel] = useState<AbaPainel>('comentarios');
  const [hoverNota, setHoverNota] = useState<number | null>(null);
  const [novoComentario, setNovoComentario] = useState('');
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);

  const ativa = useMemo(
    () => (slug ? animacoesCatalog.find((a) => a.slug === slug) || null : null),
    [slug]
  );

  const {
    userId,
    statsMap,
    ranking,
    comentarios,
    loadingComentarios,
    enviandoComentario,
    avaliar,
    toggleFavorito,
    enviarComentario,
    excluirComentario,
  } = useAnimacoesInteracoes(animacoesCatalog, ativa?.slug);

  const categorias = useMemo(() => {
    const unicas = Array.from(new Set(animacoesCatalog.map((a) => a.categoria))).sort();
    return ['Todas', 'Favoritas', ...unicas];
  }, []);

  const temasDisponiveis = useMemo(() => {
    const base = animacoesCatalog.filter((item) => {
      if (categoria === 'Favoritas') return Boolean(statsMap[item.slug]?.favoritada);
      if (categoria !== 'Todas') return item.categoria === categoria;
      return true;
    });
    const setTemas = new Set<string>();
    for (const item of base) {
      if (item.artigoRef?.trim()) setTemas.add(item.artigoRef.trim());
    }
    return ['Todos', ...Array.from(setTemas).sort()];
  }, [categoria, statsMap]);

  useEffect(() => {
    setTema('Todos');
  }, [categoria]);

  useEffect(() => {
    setIframeHeight(null);
    setHoverNota(null);
  }, [slug]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'animacao-resize' && typeof e.data.height === 'number') {
        setIframeHeight(Math.max(580, Math.ceil(e.data.height)));
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const catalogBySlug = useMemo(() => {
    const map: Record<string, AnimacaoItem> = {};
    for (const item of animacoesCatalog) map[item.slug] = item;
    return map;
  }, []);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lista = animacoesCatalog.filter((item) => {
      const stats = statsMap[item.slug];
      if (categoria === 'Favoritas') {
        if (!stats?.favoritada) return false;
      } else if (categoria !== 'Todas' && item.categoria !== categoria) {
        return false;
      }
      if (tema !== 'Todos' && (item.artigoRef?.trim() || '') !== tema) {
        return false;
      }
      if (!q) return true;
      return (
        item.titulo.toLowerCase().includes(q) ||
        (item.tituloHtml || '').toLowerCase().includes(q) ||
        (item.artigoRef || '').toLowerCase().includes(q) ||
        (item.exameRef || '').toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q)
      );
    });

    if (ordenacao === 'ranking') {
      return [...lista].sort((a, b) => {
        const sa = statsMap[a.slug];
        const sb = statsMap[b.slug];
        if ((sb?.media || 0) !== (sa?.media || 0)) return (sb?.media || 0) - (sa?.media || 0);
        return (sb?.totalVotos || 0) - (sa?.totalVotos || 0);
      });
    }
    if (ordenacao === 'comentarios') {
      return [...lista].sort(
        (a, b) => (statsMap[b.slug]?.totalComentarios || 0) - (statsMap[a.slug]?.totalComentarios || 0)
      );
    }
    return lista;
  }, [busca, categoria, tema, ordenacao, statsMap]);

  const top3Ranking = useMemo(() => ranking.slice(0, 3), [ranking]);

  const activeStats = ativa ? statsMap[ativa.slug] : undefined;
  const notaExibida = hoverNota ?? activeStats?.minhaNota ?? 0;

  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ativa) return;
    const ok = await enviarComentario(ativa.slug, novoComentario);
    if (ok) setNovoComentario('');
  };

  const handleCompartilhar = async () => {
    if (!ativa) return;
    haptic.selection();
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: formatTitulo(ativa.tituloHtml || ativa.titulo),
          text: `Confira esta animação jurídica: ${formatTitulo(ativa.tituloHtml || ativa.titulo)}`,
          url,
        });
        return;
      } catch {
        // fallback clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link da animação copiado!');
    } catch {
      toast.info('Copie a URL do navegador para compartilhar.');
    }
  };

  return (
    <div
      className={`w-full bg-[#09090B] text-foreground relative overflow-x-hidden ${
        isDesktop
          ? 'min-h-full pb-10'
          : 'min-h-screen pb-[calc(6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]'
      }`}
    >

      <main
        className={`relative z-10 max-w-[1440px] mx-auto pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] ${
          ativa ? 'px-0 sm:px-6 space-y-3 sm:space-y-4' : 'px-4 sm:px-6 space-y-6'
        }`}
      >
        {/* Header */}
        <header className={`flex items-center justify-between gap-3 ${ativa ? 'px-3 sm:px-0' : ''}`}>
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
              <h1 className="text-base sm:text-2xl font-bold text-white tracking-tight truncate">
                {ativa ? formatTitulo(ativa.tituloHtml || ativa.titulo) : 'Animações Jurídicas'}
              </h1>
              <p className="text-xs text-zinc-400 truncate">
                {ativa
                  ? `${ativa.categoria}${ativa.artigoRef ? ` • ${ativa.artigoRef}` : ''}${ativa.gabarito ? ` • Gabarito ${ativa.gabarito}` : ''}`
                  : `${animacoesCatalog.length} casos animados • Avalie, comente e favorite`}
              </p>
            </div>
          </div>

          {ativa && activeStats && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {activeStats.media > 0 ? activeStats.media.toFixed(1) : 'Novo'}
                <span className="text-zinc-400 font-normal">({activeStats.totalVotos})</span>
              </span>
            </div>
          )}
        </header>

        {/* Visualizador Responsivo + Painel de Avaliação, Comentários e Ranking */}
        {ativa ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
            {/* Coluna do Player */}
            <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center w-full space-y-3">
              <div className="relative w-full max-w-[560px] mx-auto overflow-hidden bg-[#0b1220] sm:rounded-2xl sm:border sm:border-zinc-800">
                <iframe
                  key={ativa.slug}
                  src={`${ativa.htmlR2Url}?v=6`}
                  title={formatTitulo(ativa.tituloHtml || ativa.titulo)}
                  allow="autoplay; fullscreen"
                  scrolling="no"
                  style={iframeHeight ? { height: `${iframeHeight}px` } : undefined}
                  className="w-full h-[calc(100vw*1.92+175px)] min-h-[760px] sm:h-[980px] lg:h-[1040px] border-0 block overflow-hidden bg-[#0b1220]"
                />
              </div>

              {/* Barra de Avaliação (1-5), Favoritar e Compartilhar */}
              <div className="w-full max-w-[560px] mx-auto px-3 sm:px-0">
                <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3.5 sm:p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block">
                        Avalie esta animação (1 a 5)
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((estrela) => {
                          const preenchida = estrela <= notaExibida;
                          return (
                            <button
                              key={estrela}
                              type="button"
                              onMouseEnter={() => setHoverNota(estrela)}
                              onMouseLeave={() => setHoverNota(null)}
                              onClick={() => void avaliar(ativa.slug, estrela)}
                              aria-label={`Avaliar com ${estrela} ${estrela === 1 ? 'estrela' : 'estrelas'}`}
                              className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition-transform active:scale-90"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  preenchida
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-zinc-600 hover:text-amber-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="ml-2 text-xs text-zinc-300 font-semibold">
                          {activeStats?.media ? `${activeStats.media.toFixed(1)} ★` : 'Sem votos'}
                          {activeStats?.totalVotos ? ` · ${activeStats.totalVotos} voto${activeStats.totalVotos > 1 ? 's' : ''}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleFavorito(ativa.slug)}
                        aria-label={activeStats?.favoritada ? 'Remover dos favoritos' : 'Favoritar animação'}
                        className={`min-h-[44px] px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 ${
                          activeStats?.favoritada
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-200'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${activeStats?.favoritada ? 'fill-rose-400 text-rose-400' : ''}`}
                        />
                        <span>{activeStats?.favoritada ? 'Favoritada' : 'Favoritar'}</span>
                        {activeStats && activeStats.totalFavoritos > 0 && (
                          <span className="text-[11px] opacity-80">({activeStats.totalFavoritos})</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCompartilhar()}
                        aria-label="Compartilhar animação"
                        className="min-h-[44px] w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 flex items-center justify-center transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita / Inferior: Comentários, Resumo e Ranking */}
            <div className="lg:col-span-6 xl:col-span-7 px-3 sm:px-0 w-full">
              <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden">
                {/* Seção Direta de Comentários */}
                <div className="px-4 sm:px-5 pt-4 pb-2 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                    <span>Comentários</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[11px] text-zinc-300">
                      {activeStats?.totalComentarios ?? comentarios.length}
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  
                    <div className="space-y-4">
                      <form onSubmit={handleEnviarComentario} className="space-y-2.5">
                        <textarea
                          value={novoComentario}
                          onChange={(e) => setNovoComentario(e.target.value)}
                          placeholder="Deixe sua dúvida, dica ou comentário sobre este caso..."
                          rows={2}
                          maxLength={1000}
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-600/60 resize-none"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-zinc-500">
                            {novoComentario.length}/1000 caracteres
                          </span>
                          <button
                            type="submit"
                            disabled={enviandoComentario || !novoComentario.trim()}
                            className="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{enviandoComentario ? 'Publicando...' : 'Publicar comentário'}</span>
                          </button>
                        </div>
                      </form>

                      {loadingComentarios ? (
                        <div className="py-8 text-center text-xs text-zinc-400">
                          Carregando comentários...
                        </div>
                      ) : comentarios.length === 0 ? (
                        <div className="py-8 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-400">
                          Nenhum comentário ainda. Seja o primeiro a comentar!
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                          {comentarios.map((c) => (
                            <div
                              key={c.id}
                              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-red-600/20 border border-red-600/30 text-red-400 text-xs font-bold flex items-center justify-center shrink-0">
                                    {c.autor_nome.slice(0, 1).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-semibold text-white truncate">
                                    {c.autor_nome}
                                  </span>
                                  <span className="text-[11px] text-zinc-500 shrink-0">
                                    {formatarDataCurta(c.created_at)}
                                  </span>
                                </div>
                                {userId && c.user_id === userId && (
                                  <button
                                    type="button"
                                    onClick={() => void excluirComentario(c.id, ativa.slug)}
                                    aria-label="Excluir comentário"
                                    className="w-8 h-8 rounded-lg hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                                {c.texto}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 Ranking Destaque */}
            {top3Ranking.length > 0 && !busca && categoria === 'Todas' && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-red-500" />
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-red-400">
                      Ranking de Avaliações
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setOrdenacao((cur) => (cur === 'ranking' ? 'padrao' : 'ranking'));
                    }}
                    className="text-xs font-semibold text-zinc-400 hover:text-amber-300 transition-colors"
                  >
                    {ordenacao === 'ranking' ? 'Ordem padrão' : 'Ordenar lista por ranking'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {top3Ranking.map((entry, idx) => {
                    const item = catalogBySlug[entry.slug];
                    if (!item) return null;
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          navigate(`/animacoes/${item.slug}`);
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 text-left transition-colors"
                      >
                        {item.capaR2Url ? (
                          <img
                            src={item.capaR2Url}
                            alt={formatTitulo(item.tituloHtml || item.titulo)}
                            loading="eager"
                            decoding="async"
                            className="w-12 h-[68px] rounded-lg object-cover brightness-110 contrast-105 saturate-125 shadow-md shadow-black/60 shrink-0 border border-white/15"
                          />
                        ) : (
                          <div className="w-12 h-[68px] rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                            <Clapperboard className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                            #{idx + 1} Lugar · {formatAreaCurta(item.categoria)}
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {formatTitulo(item.tituloHtml || item.titulo)}
                          </p>
                          <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 mt-0.5">
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {entry.media > 0 ? entry.media.toFixed(1) : '0.0'} ({entry.totalVotos})
                            </span>
                            <span>{entry.totalFavoritos} ♥</span>
                            <span className="text-sky-400 font-medium">{entry.totalComentarios} coment.</span>
                          </div>
                        </div>
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-md ${
                            idx === 0
                                  ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-zinc-950'
                                  : idx === 1
                                    ? 'bg-gradient-to-br from-zinc-200 to-slate-400 text-zinc-950'
                                    : 'bg-gradient-to-br from-amber-600 to-orange-800 text-white'
                          }`}
                        >
                          <Award className="w-5 h-5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Busca + Categorias + Ordenação */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar animação por caso, área ou prova (ex: OAB, Penal, Civil)..."
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-600/60 transition-colors"
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

                <div className="flex items-center gap-2 shrink-0">
                  {(
                    [
                      { id: 'padrao', label: 'Padrão' },
                      { id: 'ranking', label: 'Melhor Avaliadas' },
                      { id: 'comentarios', label: 'Mais Comentadas' },
                    ] as const
                  ).map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setOrdenacao(ord.id);
                      }}
                      className={`h-11 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                        ordenacao === ord.id
                          ? 'bg-white/15 border-red-500/50 text-red-400'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400'
                      }`}
                    >
                      {ord.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu de alternância por Áreas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Áreas do Direito
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 sm:-mx-6 px-4 sm:px-6">
                  {categorias.map((cat) => {
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
                            ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Menu de alternância por Temas */}
              {temasDisponiveis.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Temas {categoria !== 'Todas' ? `· ${categoria}` : ''}
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 sm:-mx-6 px-4 sm:px-6">
                    {temasDisponiveis.map((t) => {
                      const ativo = tema === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setTema(t);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-all ${
                            ativo
                              ? 'bg-red-600/20 text-red-400 border-red-500/60'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 border-white/10'
                          }`}
                        >
                          {t === 'Todos' ? 'Todos os temas' : t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Grid de Animações */}
            {filtradas.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-sm text-zinc-400">
                Nenhuma animação encontrada para essa busca.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtradas.map((item, idx) => {
                  const st = statsMap[item.slug];
                  return (
                    <div
                      key={item.slug}
                      onClick={() => {
                        haptic.selection();
                        navigate(`/animacoes/${item.slug}`);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/animacoes/${item.slug}`);
                        }
                      }}
                      className="group cursor-pointer flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 text-left transition-colors"
                    >
                      {item.capaR2Url ? (
                        <div className="relative w-[76px] sm:w-[88px] aspect-[7/10] rounded-xl bg-zinc-900 overflow-hidden shrink-0 border border-white/15 shadow-lg shadow-black/70">
                          <img
                            src={item.capaR2Url}
                            alt={formatTitulo(item.tituloHtml || item.titulo)}
                            loading={idx < 6 ? 'eager' : 'lazy'}
                            decoding="async"
                            className="w-full h-full object-cover brightness-110 contrast-105 saturate-125 group-hover:scale-105 transition-transform duration-300"
                          />
                          <span
                            className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded backdrop-blur-sm border text-[8px] font-bold uppercase tracking-wider max-w-[calc(100%-12px)] truncate shadow-sm ${getAreaBadgeClass(item.categoria)}`}
                          >
                            {formatAreaCurta(item.categoria)}
                          </span>
                        </div>
                      ) : (
                        <div className="w-[76px] sm:w-[88px] aspect-[7/10] rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                          <Clapperboard className="w-6 h-6 text-red-500" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getAreaBadgeClass(item.categoria)}`}>
                            {formatAreaCurta(item.categoria)}
                          </span>
                          {item.artigoRef && (
                            <span className="text-[11px] text-zinc-400 truncate">
                              {item.artigoRef}
                            </span>
                          )}
                        </div>

                        <h2 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                          {formatTitulo(item.tituloHtml || item.titulo)}
                        </h2>

                        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1 text-amber-400 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{st?.media ? st.media.toFixed(1) : '0.0'}</span>
                            <span className="text-zinc-500 font-normal">({st?.totalVotos || 0})</span>
                          </span>
                          <span className="flex items-center gap-1 text-sky-400 font-medium"><MessageSquare className="w-3.5 h-3.5" /><span>{st?.totalComentarios || 0}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleFavorito(item.slug);
                          }}
                          aria-label={st?.favoritada ? 'Remover dos favoritos' : 'Favoritar'}
                          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                            st?.favoritada
                              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${st?.favoritada ? 'fill-rose-400 text-rose-400' : ''}`} />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0">
                          <Play className="w-4 h-4 ml-0.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Animacoes;
