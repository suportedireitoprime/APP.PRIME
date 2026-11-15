import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  BookOpenText,
  X,
  Loader2,
  Mic,
  MicOff,
  ChevronRight,
  ArrowLeft,
  Heart,
  History,
  Flame,
  Scale,
  Gavel,
  Users,
  Landmark,
  FileText,
  Briefcase,
  Receipt,
  Building2,
  ShoppingCart,
  Leaf,
  Languages,
} from 'lucide-react';
import { motion } from 'framer-motion';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useDicionarioJuridico, type DicionarioTermo } from '@/hooks/useDicionarioJuridico';
import { useDicionarioStats } from '@/hooks/useDicionarioStats';
import { useDicionarioPrefs } from '@/hooks/useDicionarioPrefs';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import DicionarioCategoryChips from '@/components/ferramentas/DicionarioCategoryChips';
import DicionarioTermoSheet from '@/components/ferramentas/DicionarioTermoSheet';
import DicionarioBottomNav, { type DicionarioTab } from '@/components/ferramentas/DicionarioBottomNav';
import {
  CATEGORIAS,
  categoriaMatches,
  categoriasDoTermo,
  labelCategoria,
  type CategoriaId,
} from '@/lib/dicionarioCategorias';
import { limparMarkdown } from '@/lib/dicionarioTexto';
import { buscarTermosDetalhado, sugerir } from '@/lib/dicionarioBusca';
import { cn } from '@/lib/utils';
import { useGoBack } from '@/hooks/useGoBack';

const PAGE_SIZE = 120;

/** Áreas do Direito exibidas na aba "Áreas" (com ícone e cor próprios). */
const AREAS: { id: CategoriaId; icon: typeof Scale; color: string }[] = [
  { id: 'penal', icon: Gavel, color: 'hsl(0 72% 58%)' },
  { id: 'civil', icon: Users, color: 'hsl(210 80% 62%)' },
  { id: 'constitucional', icon: Landmark, color: 'hsl(45 90% 58%)' },
  { id: 'processual', icon: FileText, color: 'hsl(265 65% 68%)' },
  { id: 'trabalhista', icon: Briefcase, color: 'hsl(150 55% 50%)' },
  { id: 'tributario', icon: Receipt, color: 'hsl(25 85% 58%)' },
  { id: 'administrativo', icon: Building2, color: 'hsl(195 70% 55%)' },
  { id: 'empresarial', icon: Scale, color: 'hsl(320 60% 62%)' },
  { id: 'consumidor', icon: ShoppingCart, color: 'hsl(175 60% 48%)' },
  { id: 'ambiental', icon: Leaf, color: 'hsl(110 55% 50%)' },
  { id: 'latins', icon: Languages, color: 'hsl(35 45% 65%)' },
];

const DicionarioJuridicoPage = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchParams] = useSearchParams();
  const termoParam = searchParams.get('termo');
  const [query, setQuery] = useState(termoParam ?? '');
  const [categoria, setCategoria] = useState<CategoriaId>('todas');
  const [selected, setSelected] = useState<DicionarioTermo | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [tab, setTab] = useState<DicionarioTab>('dicionario');
  const [areaSel, setAreaSel] = useState<CategoriaId | null>(null);

  const { data: termos = [], isLoading } = useDicionarioJuridico();
  const abertoPorLink = useRef(false);

  // Deep link da busca global: /ferramentas/dicionario?termo=Dolo
  useEffect(() => {
    if (!termoParam || abertoPorLink.current || termos.length === 0) return;
    const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const alvo =
      termos.find((t) => norm(t.palavra) === norm(termoParam)) ||
      termos.find((t) => norm(t.palavra).startsWith(norm(termoParam)));
    if (alvo) {
      abertoPorLink.current = true;
      setSelected(alvo);
    }
  }, [termoParam, termos]);
  const { data: stats = [] } = useDicionarioStats();
  const prefs = useDicionarioPrefs();
  const voice = useVoiceInput((text) => setQuery(text));

  const clickMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stats) m.set(s.palavra, s.clicks);
    return m;
  }, [stats]);

  const catCache = useMemo(() => new Map<string, ReturnType<typeof categoriasDoTermo>>(), []);

  const contagemPorArea = useMemo(() => {
    const m = new Map<CategoriaId, number>();
    for (const a of AREAS) m.set(a.id, 0);
    for (const t of termos) {
      for (const c of categoriasDoTermo(t)) {
        if (m.has(c)) m.set(c, (m.get(c) ?? 0) + 1);
      }
    }
    return m;
  }, [termos, catCache]);

  const base = useMemo(() => {
    let list: DicionarioTermo[] = termos;

    if (tab === 'favoritos') {
      const ordem = new Map(prefs.favoritos.map((p, i) => [p, i]));
      list = termos
        .filter((t) => ordem.has(t.palavra))
        .sort((a, b) => (ordem.get(a.palavra) ?? 0) - (ordem.get(b.palavra) ?? 0));
    } else if (tab === 'recentes') {
      const ordem = new Map(prefs.recentes.map((p, i) => [p, i]));
      list = termos
        .filter((t) => ordem.has(t.palavra))
        .sort((a, b) => (ordem.get(a.palavra) ?? 0) - (ordem.get(b.palavra) ?? 0));
    } else if (tab === 'em_alta') {
      const set = new Set(stats.map((s) => s.palavra));
      list = termos
        .filter((t) => set.has(t.palavra))
        .sort((a, b) => (clickMap.get(b.palavra) ?? 0) - (clickMap.get(a.palavra) ?? 0));
    } else if (tab === 'areas') {
      list = areaSel ? termos.filter((t) => categoriaMatches(t, areaSel, catCache)) : [];
    } else if (categoria === 'em_alta') {
      const set = new Set(stats.map((s) => s.palavra));
      list = termos
        .filter((t) => set.has(t.palavra))
        .sort((a, b) => (clickMap.get(b.palavra) ?? 0) - (clickMap.get(a.palavra) ?? 0));
    } else if (categoria !== 'todas') {
      list = termos.filter((t) => categoriaMatches(t, categoria, catCache));
    }
    return list;
  }, [termos, categoria, stats, clickMap, catCache, tab, areaSel, prefs.favoritos, prefs.recentes]);

  const resultados = useMemo(
    () => (query.trim() ? buscarTermosDetalhado(base, query) : null),
    [base, query],
  );

  const filtered = useMemo(
    () => (resultados ? resultados.map((r) => r.termo) : base),
    [resultados, base],
  );

  /** Índice do primeiro resultado que só casou na definição (para o rótulo). */
  const inicioDefinicoes = useMemo(() => {
    if (!resultados) return -1;
    const i = resultados.findIndex((r) => r.apenasDefinicao);
    return i;
  }, [resultados]);

  const sugestao = useMemo(() => {
    if (!resultados) return null;
    const temPalavra = resultados.some((r) => !r.apenasDefinicao);
    if (temPalavra) return null;
    return sugerir(base, query);
  }, [resultados, base, query]);

  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);

  const handleCategoria = useCallback((id: CategoriaId) => {
    setCategoria(id);
    setVisible(PAGE_SIZE);
  }, []);

  const handleSearch = useCallback((v: string) => {
    setQuery(v);
    setVisible(PAGE_SIZE);
  }, []);

  const handleTab = useCallback((id: DicionarioTab) => {
    setTab(id);
    setAreaSel(null);
    setQuery('');
    setVisible(PAGE_SIZE);
  }, []);

  const abrirTermo = useCallback(
    (t: DicionarioTermo) => {
      prefs.registrarRecente(t.palavra);
      setSelected(t);
    },
    [prefs],
  );

  const mostrarGradeAreas = tab === 'areas' && !areaSel;

  const tituloLista =
    tab === 'favoritos'
      ? 'Favoritos'
      : tab === 'recentes'
        ? 'Recentes'
        : tab === 'em_alta'
          ? 'Em alta'
          : tab === 'areas' && areaSel
            ? labelCategoria(areaSel)
            : null;

  const vazioTexto =
    tab === 'favoritos'
      ? 'Você ainda não favoritou nenhum termo. Abra um termo e toque no coração.'
      : tab === 'recentes'
        ? 'Nenhum termo consultado ainda.'
        : tab === 'em_alta'
          ? 'Ainda não há termos em alta.'
          : `Nenhum termo encontrado${query ? ` para "${query}"` : ''}.`;

  const mobileHeader = (
    <PageHeader
      title="Dicionário Jurídico"
      subtitle={
        termos.length ? `${termos.length.toLocaleString('pt-BR')} termos` : 'Consulte termos e definições'
      }
      onBack={() => goBack()}
    />
  );

  return (
    <DesktopPageLayout
      wide
      activeId="ferramentas"
      title="Dicionário Jurídico"
      subtitle={
        termos.length
          ? `${termos.length.toLocaleString('pt-BR')} termos jurídicos`
          : 'Consulte termos e definições jurídicas'
      }
      mobileHeader={mobileHeader}
    >
      <div className="theme-vademecum-accent px-4 sm:px-6 lg:px-0 py-4 lg:py-0 pb-[calc(120px+var(--sai-bottom,0px))] lg:pb-24">
        {/* Barra de busca com voz */}
        <div className="max-w-2xl">
          <div
            className={cn(
              'relative flex items-center gap-1.5 pr-1.5 pl-4 h-14 rounded-2xl border transition-colors',
              voice.listening
                ? 'bg-primary/5 border-primary/40 shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]'
                : 'bg-secondary/60 border-border/60'
            )}
          >
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              value={voice.listening && voice.partial ? voice.partial : query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={voice.listening ? 'Ouvindo...' : 'Buscar termo jurídico...'}
              className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground/70"
            />
            {query && !voice.listening && (
              <button
                onClick={() => handleSearch('')}
                className="w-8 h-8 rounded-full hover:bg-background/60 flex items-center justify-center"
                aria-label="Limpar"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={voice.toggle}
              aria-label={voice.listening ? 'Parar' : 'Buscar por voz'}
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                voice.listening
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : 'bg-primary text-primary-foreground hover:brightness-110'
              )}
            >
              {voice.listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Chips de categorias — só na aba Dicionário */}
        {tab === 'dicionario' && (
          <div className="mt-4">
            <DicionarioCategoryChips active={categoria} onChange={handleCategoria} />
          </div>
        )}

        {/* Cabeçalho das abas com lista própria */}
        {tituloLista && (
          <div className="mt-4 flex items-center gap-2">
            {tab === 'areas' && areaSel && (
              <button
                onClick={() => setAreaSel(null)}
                aria-label="Voltar para áreas"
                className="w-9 h-9 rounded-full bg-secondary/70 flex items-center justify-center text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {tab === 'favoritos' && <Heart className="w-5 h-5 text-primary" />}
            {tab === 'recentes' && <History className="w-5 h-5 text-primary" />}
            {tab === 'em_alta' && <Flame className="w-5 h-5 text-orange-500" />}
            <h2 className="font-display text-xl font-bold text-foreground uppercase">{tituloLista}</h2>
          </div>
        )}

        {mostrarGradeAreas ? (
          <div className="mt-4">
            <h2 className="font-display text-xl font-bold text-foreground uppercase">Áreas do Direito</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Escolha uma área para ver os termos daquele campo.
            </p>
            <div className="flex flex-col gap-2">
              {AREAS.map((a) => {
                const Icon = a.icon;
                const count = contagemPorArea.get(a.id) ?? 0;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAreaSel(a.id);
                      setVisible(PAGE_SIZE);
                    }}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors text-left w-full active:scale-[0.99]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-secondary/70 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" style={{ color: a.color }} strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-foreground text-[15px] leading-tight uppercase truncate">
                        {labelCategoria(a.id)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {count.toLocaleString('pt-BR')} {count === 1 ? 'termo' : 'termos'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Contagem */}
            <div className="mt-3 mb-3 text-xs text-muted-foreground">
              {isLoading && termos.length === 0
                ? 'Carregando...'
                : `${filtered.length.toLocaleString('pt-BR')} ${
                    filtered.length === 1 ? 'termo' : 'termos'
                  }${tab === 'dicionario' && categoria !== 'todas' ? ` em ${labelCategoria(categoria)}` : ''}`}
            </div>

            {sugestao && (
              <div className="mb-3 text-sm text-muted-foreground">
                Você quis dizer{' '}
                <button
                  onClick={() => handleSearch(sugestao)}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  {sugestao}
                </button>
                ?
              </div>
            )}

            {isLoading && termos.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Carregando termos...
              </div>
            ) : shown.length === 0 ? (
              <div className="text-center py-16">
                <BookOpenText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">{vazioTexto}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                  {shown.map((t, i) => {
                    const cats = categoriasDoTermo(t);
                    const primaryCat = cats.find((c) => c !== 'latins') ?? cats[0];
                    const clicks = clickMap.get(t.palavra);
                    const card = (
                      <motion.button
                        key={`${t.letra}-${t.palavra}`}
                        onClick={() => abrirTermo(t)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.01, 0.2) }}
                        className="text-left p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                            <span className="font-display text-base font-bold text-primary">
                              {t.letra || t.palavra.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-base font-bold text-foreground truncate">
                              {t.palavra}
                            </h3>
                            <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2 mt-1">
                              {limparMarkdown(t.significado)}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {primaryCat && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                  {labelCategoria(primaryCat)}
                                </span>
                              )}
                              {cats.includes('latins') && primaryCat !== 'latins' && (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                                  Latim
                                </span>
                              )}
                              {prefs.isFavorito(t.palavra) && (
                                <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
                              )}
                              {typeof clicks === 'number' && clicks > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-orange-500">
                                  <Flame className="w-3.5 h-3.5" /> {clicks}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                    if (i === inicioDefinicoes) {
                      return (
                        <div key={`sep-${t.palavra}`} className="contents">
                          <div className="md:col-span-2 lg:col-span-3 2xl:col-span-4 pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                            Encontrados na definição
                          </div>
                          {card}
                        </div>
                      );
                    }
                    return card;
                  })}
                </div>

                {visible < filtered.length && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="px-5 h-11 rounded-xl bg-secondary/70 hover:bg-secondary text-sm font-medium"
                    >
                      Carregar mais
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <DicionarioTermoSheet
        termo={selected}
        todos={termos}
        onClose={() => setSelected(null)}
        onSelectRelated={(t) => abrirTermo(t)}
        emAltaClicks={selected ? clickMap.get(selected.palavra) : undefined}
        favorito={selected ? prefs.isFavorito(selected.palavra) : false}
        onToggleFavorito={() => selected && prefs.toggleFavorito(selected.palavra)}
      />

      <DicionarioBottomNav active={tab} onChange={handleTab} hidden={!!selected} />
    </DesktopPageLayout>
  );
};

export default DicionarioJuridicoPage;
