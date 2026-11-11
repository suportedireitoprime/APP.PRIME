import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X, Layers, Target, BarChart3, FolderPlus, RotateCcw, Filter, BookOpen, Scale, Gavel, Quote, Lightbulb, Clock, History, Dices, Route, Trophy, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import FlashcardsCargoHero from '@/components/flashcards/FlashcardsCargoHero';
import { useFlashcardsDashboard, useFlashcardsResumoAreas, FlashcardsAreaRow, FlashcardsDash } from '@/lib/flashcardsQueries';
import { FALLBACK_FLASHCARDS_AREAS } from '@/lib/flashcardsConstants';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { cn } from '@/lib/utils';
import FlashcardsFiltroSheet, { FlashcardsFiltro } from '@/components/flashcards/FlashcardsFiltroSheet';
import ShapeGrid from '@/components/ui/ShapeGrid';

const ATALHOS_FLASHCARDS = [
  { id: 'historico', label: 'Histórico', desc: 'Sessões salvas', icon: History, route: '/flashcards/historico' },
  { id: 'decks', label: 'Decks', desc: 'Seus baralhos', icon: FolderPlus, route: '/flashcards/decks' },
  { id: 'revisar', label: 'Revisão', desc: 'Volte no que errou', icon: RotateCcw, route: '/flashcards/revisar' },
  { id: 'desempenho', label: 'Desempenho', desc: 'Estatísticas', icon: BarChart3, route: '/flashcards/progresso' },
];

const Flashcards = () => {
  const navigate = useNavigate();
  const { data: dash, isLoading: loadingDash } = useFlashcardsDashboard();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();

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

  // Atualiza favoritos automaticamente ao focar na janela / voltar da matéria
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

  const loading = loadingDash;

  const areas = useMemo(() => {
    const list = areasRaw && areasRaw.length > 0 ? areasRaw : FALLBACK_FLASHCARDS_AREAS;
    return [...list].sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
  }, [areasRaw]);

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
      (a) => a.area.toLowerCase().includes(q) || (a.slug && a.slug.toLowerCase().includes(q))
    );
  }, [areas, abaAtiva, favoritos, busca]);

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Flashcards | Vade Mecum PRIME';
  }, []);

  const pct = dash && dash.total_cards ? Math.round((dash.compreendidos / dash.total_cards) * 100) : 0;
  const paraHoje = Number(dash?.a_revisar ?? 0) || Number(dash?.hoje ?? 0);
  const criticos = (dash?.temas_criticos ?? []).slice(0, 4);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-[calc(2.5rem+var(--sai-bottom,0px))]">
      <div className="fixed inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(255, 255, 255, 0.05)'
          hoverFillColor='rgba(255, 255, 255, 0.1)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>
      
      <div className="relative z-10 mx-auto w-full max-w-3xl lg:max-w-7xl 2xl:max-w-[1600px] px-0 lg:px-8 pb-12">
        <div className="space-y-6">
          {/* ── Banner de Desempenho (Hero Esmeralda Oficial) ───────────────── */}
          <div className="w-full">
            <FlashcardsCargoHero 
              pct={pct} 
              total={dash?.estudados || 0} 
              hoje={dash?.hoje || 0} 
              meta={100} 
              disponiveis={dash?.total_cards || 78077} 
              streak={dash?.streak || 0}
              onBack={() => navigate('/')}
              onOpenHoje={() => navigate('/flashcards/revisar')}
              onOpenRevisados={() => navigate('/flashcards/historico')}
              onOpenTotal={() => setFiltroAberto(true)}
            />
          </div>
        
          <div className="px-3.5 sm:px-6 lg:px-0 space-y-6">
          {/* ── Card Principal com Botão "Filtro Rápido" ───────────────── */}
          <div className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#2563eb]" />
              <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Praticar Flashcards</h2>
            </div>
            <p className="ml-3 mt-1 text-xs text-muted-foreground truncate">
              Escolha filtros por matéria, assunto e tipo para praticar.
            </p>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { haptic.selection(); setFiltroAberto(true); }}
              className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-base sm:text-lg font-black shadow-md shadow-blue-950/40 transition-colors focus-visible:outline-none border border-[#2563eb]/30"
            >
              <Filter className="h-6 w-6 text-white" strokeWidth={2} />
              <span className="tracking-wide text-white">Filtro Rápido</span>
              <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </motion.button>
          </div>



          {/* ── 4 Cards de Ações Rápidas (Decks, Revisão, Histórico, Desempenho) ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-[#2563eb]" />
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Atalhos
              </p>
            </div>
            <motion.div 
              className="grid grid-cols-4 gap-1.5 sm:gap-2.5"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.04 } }
              }}
            >
              {ATALHOS_FLASHCARDS.map((a) => {
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
                  onClick={() => { haptic.selection(); navigate(a.route); }}
                  className="group flex flex-col items-center justify-center p-2 sm:p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-zinc-400/50 transition-colors gap-1.5 text-center focus-visible:outline-none"
                >
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-zinc-400 transition-all duration-300 group-hover:text-zinc-200 group-hover:scale-110" strokeWidth={2} />
                    <Icon className="absolute inset-auto w-5 h-5 sm:w-7 sm:h-7 text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 icon-shine-mask" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-extrabold text-foreground leading-tight truncate">{a.label}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block truncate">{a.desc}</p>
                  </div>
                </motion.button>
              );
            })}
            </motion.div>
          </div>



          {/* ── Matérias de Flashcards em Lista com Cores Temáticas e Barra de Pesquisa ── */}
          <section className="pt-2 space-y-3.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-[#2563eb]" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Matérias ({areasFiltradas.length}{areasFiltradas.length !== areas.length ? ` de ${areas.length}` : ''})
                </p>
              </div>
            </div>

            {/* Barra de Pesquisa Rápida */}
            <div className="relative w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 text-zinc-400">
                <Search className="w-4 h-4 stroke-[2.2]" />
              </div>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar matéria de flashcards (ex: Penal)"
                className="w-full h-12 pl-10 pr-10 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/50 transition-all backdrop-blur-md"
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
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 backdrop-blur-md">
              {[
                { id: 'materias', label: 'Matérias', count: areas.length },
                { id: 'recentes', label: 'Recentes', count: areas.filter((a) => a.compreendidos > 0).length },
                { id: 'favoritos', label: 'Favoritos', count: favoritos.length },
              ].map((tab) => {
                const isActive = abaAtiva === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setAbaAtiva(tab.id as any);
                    }}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer",
                      isActive
                        ? "bg-[#2563eb] text-white shadow-md shadow-blue-950/40"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                        isActive ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Lista com Fundo Único Compartilhado e Divisão por Linha Fina Elegante */}
            {areasFiltradas.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-muted-foreground text-xs">
                {abaAtiva === 'favoritos'
                  ? 'Nenhuma matéria favoritada ainda. Toque na estrela para favoritar!'
                  : `Nenhuma matéria encontrada para "${busca}".`}
              </div>
            ) : (
              <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md overflow-hidden divide-y divide-zinc-800/60 shadow-lg">
                {areasFiltradas.map((area) => {
                  const iconInfo = areaIconFor(area.slug || area.area);
                  const AreaIcon = iconInfo?.Icon || BookOpen;
                  const iconColor = iconInfo?.color || '#3b82f6';
                  const pctArea = area.total_cards > 0 ? Math.round((area.compreendidos / area.total_cards) * 100) : 0;
                  const radius = 14;
                  const circumference = 2 * Math.PI * radius;
                  const strokeOffset = circumference - (circumference * Math.min(100, Math.max(0, pctArea))) / 100;
                  const isFav = favoritos.includes(area.slug || area.area);

                  return (
                    <button
                      key={area.slug || area.area}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setAreaSelecionadaModal(area);
                      }}
                      className="group relative w-full flex items-center justify-between py-4 sm:py-5 px-4 sm:px-5 min-h-[68px] sm:min-h-[76px] hover:bg-zinc-800/40 transition-colors text-left focus-visible:outline-none cursor-pointer"
                    >
                      {/* Lado Esquerdo: Ícone Maior com Cor Temática Oficial */}
                      <div className="flex items-center gap-4 min-w-0 flex-1 pr-3">
                        <div className="relative shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                          <AreaIcon
                            className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 group-hover:scale-110"
                            style={{ color: iconColor }}
                            strokeWidth={1.8}
                          />
                        </div>

                        {/* Detalhes da Matéria */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-white transition-colors truncate">
                            {area.area}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 shrink-0">
                              {area.total_cards > 0 ? `${area.total_cards.toLocaleString('pt-BR')} cards` : 'Em breve'}
                            </span>
                            {isFav && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 shrink-0">
                                • <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                              </span>
                            )}
                            {area.compreendidos > 0 && (
                              <span className="text-[11px] sm:text-xs font-medium text-emerald-400 shrink-0">
                                • {area.compreendidos} dominados
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Barra de Progresso Circular e Chevron */}
                      <div className="shrink-0 flex items-center gap-2.5 pl-2">
                        {/* Barra de Progresso Circular na Direita */}
                        <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                            {/* Trilho de fundo circular */}
                            <circle
                              cx="18"
                              cy="18"
                              r={radius}
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.08)"
                              strokeWidth="3"
                            />
                            {/* Progresso preenchido na cor da matéria */}
                            {area.compreendidos > 0 && (
                              <circle
                                cx="18"
                                cy="18"
                                r={radius}
                                fill="none"
                                stroke={iconColor}
                                strokeWidth="3.2"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeOffset}
                                strokeLinecap="round"
                                style={{
                                  filter: `drop-shadow(0 0 4px ${iconColor}80)`,
                                  transition: 'stroke-dashoffset 0.5s ease',
                                }}
                              />
                            )}
                          </svg>

                          {/* Valor da porcentagem no centro do círculo (ou traço neutro se 0%) */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {area.compreendidos > 0 ? (
                              <span 
                                className="text-[10px] sm:text-[11px] font-mono font-black"
                                style={{ color: pctArea === 100 ? '#10b981' : iconColor }}
                              >
                                {pctArea}%
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-zinc-600">
                                0%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chevron de navegação */}
                        <div className="w-6 h-6 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">
                          <ChevronRight className="w-4 h-4 stroke-[2]" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>




        </div>
      </div>
    </div>

      {/* ── Modal Flutuante: Opções da Matéria (Filtrar vs Trilhas) ── */}
      <AnimatePresence>
        {areaSelecionadaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAreaSelecionadaModal(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Card Flutuante */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl z-10 overflow-hidden"
            >
              {/* Fechar */}
              <button
                type="button"
                onClick={() => setAreaSelecionadaModal(null)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Informações da Matéria */}
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-inner mb-3">
                  {(() => {
                    const AreaIcon = areaIconFor(areaSelecionadaModal.slug || areaSelecionadaModal.area)?.Icon || BookOpen;
                    return <AreaIcon className="w-7 h-7 text-zinc-200" strokeWidth={1.8} />;
                  })()}
                </div>
                <h3 className="text-lg font-bold text-white leading-snug px-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {areaSelecionadaModal.area}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {areaSelecionadaModal.total_cards > 0 ? `${areaSelecionadaModal.total_cards.toLocaleString('pt-BR')} flashcards disponíveis` : 'Matéria'}
                </p>
              </div>

              {/* Opções de Ação */}
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
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-800/90 hover:bg-zinc-750 border border-zinc-700 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2563eb]/15 border border-[#2563eb]/30 flex items-center justify-center text-[#2563eb] group-hover:scale-105 transition-transform">
                      <Filter className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#2563eb] transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Filtrar Assuntos
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Escolha temas, tipos e quantidade
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const slug = areaSelecionadaModal.slug || areaSelecionadaModal.area;
                    setAreaSelecionadaModal(null);
                    navigate(`/flashcards/area/${slug}`);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] border border-[#2563eb]/40 text-left text-white shadow-lg shadow-blue-950/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Route className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Ir para as Trilhas
                      </p>
                      <p className="text-[11px] text-blue-100/80">
                        Trilha progressiva deck a deck
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FlashcardsFiltroSheet
        aberto={filtroAberto}
        disciplinaInicial={filtroDisciplinaPrevia}
        passoInicial={filtroPassoPrevio}
        onFechar={() => {
          setFiltroAberto(false);
          setFiltroDisciplinaPrevia(undefined);
          setFiltroPassoPrevio(undefined);
        }}
        onAplicar={(f) => {
          setFiltroAberto(false);
          setFiltroDisciplinaPrevia(undefined);
          setFiltroPassoPrevio(undefined);
          const p = new URLSearchParams();
          if (f.disciplinas && f.disciplinas.length) p.set('areas', f.disciplinas.join('|'));
          if (f.assuntos && f.assuntos.length) p.set('temas', f.assuntos.join('|'));
          if (f.tipos && f.tipos.length) p.set('tipos', f.tipos.join('|'));
          if (f.status && f.status.length) p.set('modo', f.status[0]);
          if (f.quantidade) p.set('limite', String(f.quantidade));
          
          navigate(`/flashcards/estudar?${p.toString()}`);
        }}
      />
    </div>
  );
};

export default Flashcards;
