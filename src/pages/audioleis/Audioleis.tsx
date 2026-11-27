import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Headphones,
  Play,
  Search,
  Sparkles,
  Volume2,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { AudioNavigationSwitcher } from '@/components/audio/AudioNavigationSwitcher';
import { useIsDesktop } from '@/hooks/use-desktop';
import { haptic } from '@/lib/nativeHaptics';
import { resetGlobalScroll } from '@/lib/scrollUtils';
import {
  carregarCatalogoAudioleis,
  carregarRankingMaisAcessados,
  carregarUltimoAudiolei,
  formatarDuracao,
  registrarAcessoAudiolei,
  type ArtigoNarradoItem,
  type LeiComNarracao,
  type RankingAudioleiItem,
  type UltimoAudiolei,
} from '@/services/audioleisService';

const AudioleiFollowPlayer = React.lazy(
  () => import('@/components/audioleis/AudioleiFollowPlayer')
);

const CATEGORIAS_CONFIG: Array<{ id: string; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'constituicao', label: 'Constituição' },
  { id: 'codigo', label: 'Códigos' },
  { id: 'estatuto', label: 'Estatutos' },
  { id: 'lei-especial', label: 'Leis Especiais' },
  { id: 'previdenciario', label: 'Previdenciário' },
  { id: 'lei-ordinaria', label: 'Outras Leis' },
];

const Audioleis: React.FC = () => {
  const navigate = useNavigate();
  const { leiId: leiIdParam } = useParams<{ leiId?: string }>();
  const isDesktop = useIsDesktop();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const rankingSectionRef = useRef<HTMLElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [leis, setLeis] = useState<LeiComNarracao[]>([]);
  const [todosArtigos, setTodosArtigos] = useState<ArtigoNarradoItem[]>([]);
  const [ranking, setRanking] = useState<RankingAudioleiItem[]>([]);
  const [ultimoOuvido, setUltimoOuvido] = useState<UltimoAudiolei | null>(null);

  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');
  const [filtroTopProvas, setFiltroTopProvas] = useState(false);
  const [leiSelecionadaId, setLeiSelecionadaId] = useState<string | null>(leiIdParam || null);
  const [artigoAtivo, setArtigoAtivo] = useState<ArtigoNarradoItem | null>(null);

  useEffect(() => {
    setLeiSelecionadaId(leiIdParam || null);
  }, [leiIdParam]);

  useEffect(() => {
    let active = true;

    async function init() {
      setLoading(true);
      try {
        const [{ leis: leisLoaded, todosArtigos: artsLoaded }, ultimo] = await Promise.all([
          carregarCatalogoAudioleis(),
          carregarUltimoAudiolei(),
        ]);
        if (!active) return;

        setLeis(leisLoaded);
        setTodosArtigos(artsLoaded);
        setUltimoOuvido(ultimo);

        const rankData = await carregarRankingMaisAcessados(artsLoaded, 5);
        if (active) setRanking(rankData);
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  const leiSelecionada = useMemo(
    () => leis.find((l) => l.id === leiSelecionadaId) || null,
    [leis, leiSelecionadaId]
  );

  // No Desktop, ao abrir uma lei, pré-seleciona o primeiro artigo para leitura imediata se nenhum estiver ativo
  useEffect(() => {
    if (isDesktop && leiSelecionada && !artigoAtivo && leiSelecionada.artigos.length > 0) {
      setArtigoAtivo(leiSelecionada.artigos[0]);
    }
  }, [isDesktop, leiSelecionada, artigoAtivo]);

  const queryNorm = busca.trim().toLowerCase();
  const buscaNumerica = queryNorm.replace(/\D/g, '');

  const categoriasDisponiveis = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of leis) {
      const tipoKey = CATEGORIAS_CONFIG.some((c) => c.id === l.tipo) ? l.tipo : 'lei-ordinaria';
      counts.set(tipoKey, (counts.get(tipoKey) || 0) + 1);
    }
    return CATEGORIAS_CONFIG.filter((c) => c.id === 'todas' || (counts.get(c.id) || 0) > 0).map(
      (c) => ({
        ...c,
        count: c.id === 'todas' ? leis.length : counts.get(c.id) || 0,
      })
    );
  }, [leis]);

  const leisFiltradas = useMemo(() => {
    const base =
      categoriaAtiva === 'todas'
        ? leis
        : leis.filter((l) => {
            const tipoKey = CATEGORIAS_CONFIG.some((c) => c.id === l.tipo)
              ? l.tipo
              : 'lei-ordinaria';
            return tipoKey === categoriaAtiva;
          });

    if (!queryNorm) return base;
    return base.filter(
      (l) =>
        l.nome.toLowerCase().includes(queryNorm) ||
        l.sigla.toLowerCase().includes(queryNorm) ||
        l.artigos.some((a) =>
          buscaNumerica
            ? a.artigoNumero.replace(/\D/g, '').includes(buscaNumerica)
            : a.artigoNumero.toLowerCase().includes(queryNorm)
        )
    );
  }, [leis, categoriaAtiva, queryNorm, buscaNumerica]);

  const artigosBuscaDireta = useMemo(() => {
    if (!queryNorm || queryNorm.length < 1 || leiSelecionada) return [];
    return todosArtigos
      .filter((a) =>
        buscaNumerica
          ? a.artigoNumero.replace(/\D/g, '') === buscaNumerica ||
            a.artigoNumero.toLowerCase().includes(queryNorm)
          : a.artigoNumero.toLowerCase().includes(queryNorm) ||
            a.leiSigla.toLowerCase().includes(queryNorm)
      )
      .slice(0, 8);
  }, [todosArtigos, queryNorm, buscaNumerica, leiSelecionada]);

  const artigosDaLeiFiltrados = useMemo(() => {
    if (!leiSelecionada) return [];
    let list = leiSelecionada.artigos;
    if (filtroTopProvas) {
      list = list.filter((a) => a.scoreProva >= 70);
    }
    if (queryNorm) {
      list = list.filter((a) =>
        buscaNumerica
          ? a.artigoNumero.replace(/\D/g, '').includes(buscaNumerica)
          : a.artigoNumero.toLowerCase().includes(queryNorm)
      );
    }
    return list;
  }, [leiSelecionada, filtroTopProvas, queryNorm, buscaNumerica]);

  const iniciarArtigo = (artigo: ArtigoNarradoItem) => {
    haptic.selection();
    setArtigoAtivo(artigo);
    setUltimoOuvido({
      tabelaNome: artigo.tabelaNome,
      leiId: artigo.leiId,
      leiNome: artigo.leiNome,
      leiSigla: artigo.leiSigla,
      artigoNumero: artigo.artigoNumero,
      audioUrl: artigo.audioUrl,
    });
    void registrarAcessoAudiolei(artigo);
  };

  const abrirLei = (id: string) => {
    haptic.selection();
    setLeiSelecionadaId(id);
    setFiltroTopProvas(false);
    setBusca('');
    navigate(`/audioleis/${id}`);
  };

  const voltarParaHub = () => {
    haptic.selection();
    setLeiSelecionadaId(null);
    setArtigoAtivo(null);
    setBusca('');
    navigate('/audioleis');
  };

  const listaNavegavel = leiSelecionada ? artigosDaLeiFiltrados : todosArtigos;
  const idxAtivo = artigoAtivo
    ? listaNavegavel.findIndex(
        (a) =>
          a.tabelaNome === artigoAtivo.tabelaNome &&
          a.artigoNumero === artigoAtivo.artigoNumero
      )
    : -1;

  const totalArtigos = todosArtigos.length;

  return (
    <div
      className={`w-full bg-[#09090B] text-foreground relative overflow-x-hidden ${
        isDesktop
          ? 'min-h-full pb-10'
          : 'min-h-screen pb-[calc(6rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]'
      }`}
    >
      {!isDesktop && (
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
      )}

      <div className="relative z-10">
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] space-y-6">
          {/* Header minimalista (sem painel/banner) */}
          {!leiSelecionada && (
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    resetGlobalScroll();
                    navigate('/');
                  }}
                  aria-label="Voltar para início"
                  className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                    Ouça a Lei
                  </h1>
                  <p className="text-xs text-zinc-400 truncate">
                    {loading
                      ? 'Carregando narrações...'
                      : `${leis.length} ${leis.length === 1 ? 'lei' : 'leis'} • ${totalArtigos} artigos narrados`}
                  </p>
                </div>
              </div>

              <AudioNavigationSwitcher active="leis" className="hidden sm:flex" />
            </header>
          )}

          {/* Header quando uma lei está selecionada */}
          {leiSelecionada && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={voltarParaHub}
                  aria-label="Voltar para Ouça a Lei"
                  className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[11px] font-bold text-purple-300">
                      {leiSelecionada.sigla}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {leiSelecionada.totalNarracoes} artigos narrados
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate mt-0.5">
                    {leiSelecionada.nome}
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFiltroTopProvas((v) => !v);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors shrink-0 flex items-center gap-1.5 ${
                  filtroTopProvas
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Top Provas</span>
              </button>
            </div>
          )}

          {/* Barra de busca minimalista */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={
                leiSelecionada
                  ? `Buscar artigo em ${leiSelecionada.sigla} (ex: 5, 121)...`
                  : 'Buscar lei ou número de artigo (ex: CF/88, 121, Art. 5)...'
              }
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/60 transition-colors"
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

          {/* Hub principal (nenhuma lei selecionada) */}
          {!leiSelecionada && (
            <>
              {/* Resultados diretos por número de artigo na busca */}
              {artigosBuscaDireta.length > 0 && (
                <section className="space-y-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Artigos encontrados
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {artigosBuscaDireta.map((art) => (
                      <button
                        key={`${art.tabelaNome}_${art.artigoNumero}`}
                        type="button"
                        onClick={() => iniciarArtigo(art)}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-purple-300">
                            {art.leiSigla}
                          </span>
                          <p className="text-sm font-semibold text-white truncate">
                            Art. {art.artigoNumero}
                          </p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-purple-600/20 text-purple-300 flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 ml-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Categorias para acesso rápido */}
              {categoriasDisponiveis.length > 1 && (
                <section className="space-y-2">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {categoriasDisponiveis.map((cat) => {
                      const ativa = categoriaAtiva === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setCategoriaAtiva(cat.id);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-all ${
                            ativa
                              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/25'
                              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                          }`}
                        >
                          {cat.label}{' '}
                          <span className={ativa ? 'text-purple-100' : 'text-zinc-500'}>
                            ({cat.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Atalhos rápidos */}
              {ultimoOuvido && (
                <section className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const match = todosArtigos.find(
                        (a) =>
                          a.tabelaNome === ultimoOuvido.tabelaNome &&
                          a.artigoNumero === ultimoOuvido.artigoNumero
                      );
                      if (match) {
                        iniciarArtigo(match);
                      } else {
                        iniciarArtigo({
                          tabelaNome: ultimoOuvido.tabelaNome,
                          leiId: ultimoOuvido.leiId,
                          leiNome: ultimoOuvido.leiNome,
                          leiSigla: ultimoOuvido.leiSigla,
                          leiTipo: 'codigo',
                          artigoNumero: ultimoOuvido.artigoNumero,
                          audioUrl: ultimoOuvido.audioUrl,
                          duracaoSegundos: 0,
                          scoreProva: 0,
                        });
                      }
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-600/20 via-purple-500/10 to-transparent border border-purple-500/30 hover:border-purple-400/50 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-600/30">
                        <Headphones className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                          Continuar ouvindo
                        </span>
                        <p className="text-sm font-bold text-white truncate">
                          {ultimoOuvido.leiSigla} • Art. {ultimoOuvido.artigoNumero}
                        </p>
                      </div>
                    </div>
                    <Play className="w-5 h-5 text-purple-300 shrink-0" />
                  </button>
                </section>
              )}

              {/* Ranking dos Mais Acessados (compacto horizontal no mobile) */}
              {ranking.length > 0 && (
                <section ref={rankingSectionRef} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                      Mais Acessados
                    </h2>
                  </div>

                  <div className="flex lg:grid lg:grid-cols-5 gap-2.5 overflow-x-auto pb-1 no-scrollbar snap-x">
                    {ranking.map((item) => (
                      <button
                        key={`rank_${item.tabelaNome}_${item.artigoNumero}`}
                        type="button"
                        onClick={() => iniciarArtigo(item)}
                        className="group min-w-[165px] lg:min-w-0 snap-start flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-all shrink-0 lg:shrink"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                              item.rank === 1
                                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                                : 'bg-white/5 text-zinc-400 border border-white/10'
                            }`}
                          >
                            #{item.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-purple-300 truncate">
                              {item.leiSigla}
                            </p>
                            <p className="text-xs font-semibold text-white truncate">
                              Art. {item.artigoNumero}
                            </p>
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-purple-600 text-zinc-300 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          <Play className="w-3 h-3 ml-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Leis disponíveis com narração */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Leis com Narração ({leisFiltradas.length})
                  </h2>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5"
                      />
                    ))}
                  </div>
                ) : leisFiltradas.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-sm text-zinc-400">
                    Nenhuma lei com narração encontrada para essa busca.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {leisFiltradas.map((lei) => (
                      <button
                        key={lei.id}
                        type="button"
                        onClick={() => abrirLei(lei.id)}
                        className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-purple-500/40 text-left transition-all"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                            style={{ backgroundColor: `${lei.iconColor}20` }}
                          >
                            <Volume2
                              className="w-5 h-5"
                              style={{ color: lei.iconColor }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                                {lei.sigla}
                              </span>
                              <span className="text-[11px] text-zinc-500">
                                • {lei.totalNarracoes} arts.
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white truncate mt-0.5">
                              {lei.nome}
                            </h3>
                            {lei.duracaoTotalSegundos > 0 && (
                              <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatarDuracao(lei.duracaoTotalSegundos)} de áudio</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Lista de artigos da lei selecionada + Leitor acompanhado */}
          {leiSelecionada && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-5 space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {artigosDaLeiFiltrados.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-sm text-zinc-400">
                    Nenhum artigo narrado corresponde ao filtro atual.
                  </div>
                ) : (
                  artigosDaLeiFiltrados.map((art) => {
                    const isAtivo =
                      artigoAtivo?.tabelaNome === art.tabelaNome &&
                      artigoAtivo?.artigoNumero === art.artigoNumero;

                    return (
                      <button
                        key={`${art.tabelaNome}_${art.artigoNumero}`}
                        type="button"
                        onClick={() => iniciarArtigo(art)}
                        className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all ${
                          isAtivo
                            ? 'bg-purple-600/20 border-purple-500/50 text-white'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-zinc-200'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isAtivo
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-purple-300'
                            }`}
                          >
                            <Play className="w-4 h-4 ml-0.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                Art. {art.artigoNumero}
                              </span>
                              {art.scoreProva >= 80 && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold text-amber-300">
                                  Top Prova
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400">
                              {art.duracaoSegundos > 0
                                ? formatarDuracao(art.duracaoSegundos)
                                : 'Áudio disponível'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Desktop: leitor sempre visível ao lado */}
              {isDesktop && artigoAtivo && (
                <div className="lg:col-span-7">
                  <React.Suspense
                    fallback={
                      <div className="h-[620px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />
                    }
                  >
                    <AudioleiFollowPlayer
                      artigo={artigoAtivo}
                      hasPrev={idxAtivo > 0}
                      hasNext={idxAtivo >= 0 && idxAtivo < listaNavegavel.length - 1}
                      onPrev={() => idxAtivo > 0 && iniciarArtigo(listaNavegavel[idxAtivo - 1])}
                      onNext={() =>
                        idxAtivo >= 0 &&
                        idxAtivo < listaNavegavel.length - 1 &&
                        iniciarArtigo(listaNavegavel[idxAtivo + 1])
                      }
                    />
                  </React.Suspense>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile / Hub modal: leitor com texto acompanhado */}
      {artigoAtivo && (!isDesktop || !leiSelecionada) && (
        <React.Suspense fallback={null}>
          <AudioleiFollowPlayer
            isModal
            artigo={artigoAtivo}
            hasPrev={idxAtivo > 0}
            hasNext={idxAtivo >= 0 && idxAtivo < listaNavegavel.length - 1}
            onPrev={() => idxAtivo > 0 && iniciarArtigo(listaNavegavel[idxAtivo - 1])}
            onNext={() =>
              idxAtivo >= 0 &&
              idxAtivo < listaNavegavel.length - 1 &&
              iniciarArtigo(listaNavegavel[idxAtivo + 1])
            }
            onClose={() => setArtigoAtivo(null)}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default Audioleis;
