import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Search, X, Layers, BarChart3, 
  RotateCcw, Filter, BookOpen, Landmark, History, Heart 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { useFlashcardsDashboard, useFlashcardsResumoAreas, FlashcardsAreaRow } from '@/lib/flashcardsQueries';
import { FALLBACK_FLASHCARDS_AREAS } from '@/lib/flashcardsConstants';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { cn } from '@/lib/utils';
import FlashcardsHero from '@/components/flashcards/FlashcardsHero';
import FlashcardsFiltroSheet, { FlashcardsFiltro } from '@/components/flashcards/FlashcardsFiltroSheet';
import ShapeGrid from '@/components/ui/ShapeGrid';

// Formatação limpa do nome da matéria (remove prefixo "Direito" para exibição direta)
export const formatarNomeArea = (nome: string) => {
  if (!nome) return '';
  const limpo = nome.replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '').trim();
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
};

const ATALHOS_4 = [
  { id: 'historico', label: 'Histórico', desc: 'Sessões salvas', icon: History, route: '/flashcards/historico' },
  { id: 'decks', label: 'Decks', desc: 'Seus baralhos', icon: Layers, route: '/flashcards/decks' },
  { id: 'revisar', label: 'Revisão', desc: 'Volte no que errou', icon: RotateCcw, route: '/flashcards/revisar' },
  { id: 'progresso', label: 'Progresso', desc: 'Estatísticas', icon: BarChart3, route: '/flashcards/progresso' },
];

const Flashcards = () => {
  const navigate = useNavigate();
  const { data: dash } = useFlashcardsDashboard();
  const { data: areasRaw } = useFlashcardsResumoAreas();

  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtroDisciplinaPrevia, setFiltroDisciplinaPrevia] = useState<string | undefined>();
  const [filtroPassoPrevio, setFiltroPassoPrevio] = useState<'disciplinas' | 'assuntos' | 'tipos' | 'status' | 'quantidade' | undefined>();
  const [areaSelecionadaModal, setAreaSelecionadaModal] = useState<FlashcardsAreaRow | null>(null);
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'materias' | 'recentes' | 'favoritos'>('materias');
  
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('flashcards_favoritos_areas');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Sincroniza favoritos automaticamente
  useEffect(() => {
    const syncFavs = () => {
      try {
        const raw = localStorage.getItem('flashcards_favoritos_areas');
        setFavoritos(raw ? JSON.parse(raw) : []);
      } catch {}
    };
    window.addEventListener('focus', syncFavs);
    window.addEventListener('storage', syncFavs);
    return () => {
      window.removeEventListener('focus', syncFavs);
      window.removeEventListener('storage', syncFavs);
    };
  }, []);

  const areas = useMemo(() => {
    const list = areasRaw && areasRaw.length > 0 ? areasRaw : FALLBACK_FLASHCARDS_AREAS;
    return [...list].sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
  }, [areasRaw]);

  const totalCardsGeral = useMemo(() => {
    return areas.reduce((acc, a) => acc + (a.total_cards || 0), 0);
  }, [areas]);

  const areasFiltradas = useMemo(() => {
    let list = areas;
    if (abaAtiva === 'favoritos') {
      list = list.filter((a) => favoritos.includes(a.slug || a.area));
    } else if (abaAtiva === 'recentes') {
      const comProgresso = list.filter((a) => a.compreendidos > 0);
      list = comProgresso.length > 0 ? comProgresso : list.slice(0, 5);
    }

    if (!busca.trim()) return list;
    const q = busca.toLowerCase();
    return list.filter(
      (a) => 
        a.area.toLowerCase().includes(q) || 
        formatarNomeArea(a.area).toLowerCase().includes(q) || 
        (a.slug && a.slug.toLowerCase().includes(q))
    );
  }, [areas, abaAtiva, favoritos, busca]);

  const pct = dash?.estudados ? Math.round((dash.compreendidos / dash.estudados) * 100) : 0;

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Praticar Flashcards | Vade Mecum PRIME';
  }, []);

  return (
    <div className="theme-flashcards min-h-screen bg-background relative overflow-hidden pb-12">
      {/* ── Fundo Animado com Quadradinhos (ShapeGrid Oficial do App) ── */}
      <div className="fixed inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
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

      <div className="relative z-10 mx-auto w-full max-w-3xl lg:max-w-7xl 2xl:max-w-[1600px] px-0 lg:px-8 pb-12">
        <div className="space-y-6">
          {/* ── Banner de Desempenho / Hero Oficial (Azul) ───────────────── */}
          <div className="w-full">
            <FlashcardsHero
              pct={pct}
              total={dash?.estudados ?? 0}
              hoje={dash?.hoje ?? 0}
              compreendidos={dash?.compreendidos ?? 0}
              disponiveis={totalCardsGeral > 0 ? totalCardsGeral : 127200}
              streak={dash?.streak ?? 0}
              onBack={() => navigate('/')}
              onNavigateHistorico={() => navigate('/flashcards/historico')}
              onNavigateProgresso={() => navigate('/flashcards/progresso')}
            />
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
            }}
            initial="hidden" 
            animate="show"
            className="px-3.5 sm:px-6 lg:px-0 space-y-6"
          >
            {/* ── Card Principal com Botão "Filtro Rápido" (Azul Oficial) ───────────────── */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} 
              className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl"
            >
              <div className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-blue-500" />
                <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">Praticar Flashcards</h2>
              </div>
              <p className="ml-3 mt-1 text-xs text-muted-foreground">
                Escolha filtros personalizados e comece sua rotina de memorização.
              </p>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { 
                  haptic.selection(); 
                  setFiltroAberto(true); 
                }}
                className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:brightness-110 text-white text-base sm:text-lg font-black shadow-xl shadow-black/40 transition-all focus-visible:outline-none border border-blue-400/30 cursor-pointer [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]"
              >
                <Filter className="h-6 w-6 text-white drop-shadow-md" strokeWidth={2.5} />
                <span className="tracking-wide text-white">Filtro Rápido</span>
                <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1 drop-shadow-md" strokeWidth={2.5} />
              </motion.button>
            </motion.div>

            {/* ── 4 Cards de Atalhos (Histórico, Decks, Revisão, Progresso) ── */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                }}
                initial="hidden" 
                animate="show"
                className="grid grid-cols-4 max-w-2xl mx-auto gap-2 lg:gap-4"
              >
                {ATALHOS_4.map((a) => {
                  const Icon = a.icon;
                  return (
                    <motion.button
                      key={a.id}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { 
                        haptic.selection(); 
                        navigate(a.route); 
                      }}
                      className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-blue-500/50 transition-colors gap-2 text-center focus-visible:outline-none cursor-pointer"
                    >
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-400 transition-all duration-300 group-hover:text-blue-400 group-hover:scale-110" strokeWidth={2} />
                        <Icon className="absolute inset-auto w-7 h-7 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 icon-shine-mask" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-foreground leading-tight">{a.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{a.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* ── Matérias (Lista de Disciplinas de Flashcards) ───────────────────── */}
            <motion.section 
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} 
              className="space-y-3 pt-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-blue-500" />
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    Matérias ({areas.length})
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Toque para filtrar ou ver trilhas
                </span>
              </div>

              {/* Barra de Pesquisa Rápida */}
              <div className="relative w-full">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 text-muted-foreground">
                  <Search className="w-4 h-4 stroke-[2.2]" />
                </div>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar matéria de flashcards (ex: Penal)"
                  className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-2xl text-sm bg-card/80 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-sm"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer z-10"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Menu de Alternância (Matérias, Recentes, Favoritos) */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-card/80 border border-border/80 backdrop-blur-md w-full">
                {[
                  { id: 'materias', label: 'Matérias', icon: Landmark },
                  { id: 'recentes', label: 'Recentes', icon: RotateCcw },
                  { id: 'favoritos', label: 'Favoritos', icon: Heart },
                ].map((tab) => {
                  const isActive = abaAtiva === tab.id;
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        setAbaAtiva(tab.id as any);
                      }}
                      className={cn(
                        "w-full py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border min-w-0",
                        isActive
                          ? "bg-blue-600 text-white border-blue-500/40 shadow-md shadow-blue-900/30 font-black"
                          : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <TabIcon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-zinc-400")} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Lista de Matérias com Cards Estilo Questões */}
              {areasFiltradas.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-card/40 border border-border/60 text-muted-foreground text-xs">
                  {abaAtiva === 'favoritos'
                    ? 'Nenhuma matéria favoritada ainda. Abra a matéria e toque no coração para favoritar!'
                    : `Nenhuma matéria encontrada para "${busca}".`}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  {areasFiltradas.map((area) => {
                    const iconInfo = areaIconFor(area.slug || area.area);
                    const AreaIcon = iconInfo?.Icon || BookOpen;
                    const isFav = favoritos.includes(area.slug || area.area);

                    return (
                      <motion.button
                        key={area.slug || area.area}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => {
                          haptic.selection();
                          setAreaSelecionadaModal(area);
                        }}
                        className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-blue-500/50 hover:bg-zinc-850/90 backdrop-blur-md transition-all text-left overflow-hidden shadow-sm hover:shadow-md focus-visible:outline-none w-full cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3">
                          <div className="shrink-0 flex items-center justify-center pl-1">
                            <AreaIcon
                              className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 group-hover:scale-110 transition-transform duration-200"
                              strokeWidth={2.2}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-bold text-foreground leading-snug truncate group-hover:text-white transition-colors">
                              {area.area}
                            </p>
                            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 group-hover:text-blue-400 transition-colors flex items-center gap-1 font-medium">
                              <span>Filtrar flashcards</span>
                              {isFav && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 shrink-0">
                                  • <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/50 shrink-0 font-mono">
                            {area.total_cards > 0 ? `${area.total_cards.toLocaleString('pt-BR')} cards` : 'Em breve'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.section>
          </motion.div>
        </div>
      </div>

      {/* ── Modal Flutuante: Opções da Matéria (Filtrar vs Trilhas) ── */}
      <AnimatePresence>
        {areaSelecionadaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAreaSelecionadaModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10 overflow-hidden bg-zinc-950 border border-border/80"
            >
              <button
                type="button"
                onClick={() => setAreaSelecionadaModal(null)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-inner mb-3">
                  {(() => {
                    const AreaIcon = areaIconFor(areaSelecionadaModal.slug || areaSelecionadaModal.area)?.Icon || BookOpen;
                    return <AreaIcon className="w-7 h-7 text-blue-400" strokeWidth={2} />;
                  })()}
                </div>
                <h3 className="text-lg font-bold text-foreground leading-snug px-2">
                  {areaSelecionadaModal.area}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {areaSelecionadaModal.total_cards > 0 ? `${areaSelecionadaModal.total_cards.toLocaleString('pt-BR')} flashcards disponíveis` : 'Matéria'}
                </p>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const areaNome = areaSelecionadaModal.area;
                    setAreaSelecionadaModal(null);
                    setFiltroDisciplinaPrevia(areaNome);
                    setFiltroPassoPrevio('assuntos');
                    setFiltroAberto(true);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card hover:bg-zinc-800/80 border border-border/80 hover:border-blue-500/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Filter className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">
                        Filtrar Assuntos
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Escolha temas, tipos e quantidade
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const slug = areaSelecionadaModal.slug || areaSelecionadaModal.area;
                    setAreaSelecionadaModal(null);
                    navigate(`/flashcards/area/${slug}`);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-card hover:bg-zinc-800/80 border border-border/80 hover:border-blue-500/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">
                        Trilhas de Estudo
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Avançar pelos decks temáticos na montanha
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Filtro Rápido (Sheet Oficial de Seleção) ── */}
      <FlashcardsFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={(filtro: FlashcardsFiltro) => {
          setFiltroAberto(false);
          const params = new URLSearchParams();
          if (filtro.disciplinas && filtro.disciplinas.length > 0) params.set('disciplinas', filtro.disciplinas.join(','));
          if (filtro.assuntos && filtro.assuntos.length > 0) params.set('assuntos', filtro.assuntos.join(','));
          if (filtro.tipos && filtro.tipos.length > 0) params.set('tipos', filtro.tipos.join(','));
          if (filtro.status && filtro.status.length > 0) params.set('status', filtro.status.join(','));
          if (filtro.quantidade && filtro.quantidade > 0) params.set('quantidade', filtro.quantidade.toString());
          navigate(`/flashcards/estudo?${params.toString()}`);
        }}
        disciplinaInicial={filtroDisciplinaPrevia}
        passoInicial={filtroPassoPrevio}
      />
    </div>
  );
};

export default Flashcards;
