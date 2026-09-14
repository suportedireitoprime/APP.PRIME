import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X, Layers, Target, BarChart3, FolderPlus, RotateCcw, Filter, BookOpen, Scale, Gavel, Quote, Lightbulb, Clock, History, Dices, Route, Trophy, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import FlashcardsCargoHero from '@/components/flashcards/FlashcardsCargoHero';
import { useFlashcardsDashboard, useFlashcardsResumoAreas, FlashcardsAreaRow, FlashcardsDash } from '@/lib/flashcardsQueries';
import { FALLBACK_FLASHCARDS_AREAS } from '@/lib/flashcardsConstants';
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import FlashcardsFiltroSheet, { FlashcardsFiltro } from '@/components/flashcards/FlashcardsFiltroSheet';
import ShapeGrid from '@/components/ui/ShapeGrid';
import FlashcardsMasterDeck from '@/components/flashcards/FlashcardsMasterDeck';

const ATALHOS_FLASHCARDS = [
  { id: 'decks', label: 'Decks', desc: 'Seus baralhos', icon: FolderPlus, route: '/flashcards/decks' },
  { id: 'revisar', label: 'Revisão', desc: 'Volte no que errou', icon: RotateCcw, route: '/flashcards/revisar' },
  { id: 'historico', label: 'Histórico', desc: 'Sessões salvas', icon: History, route: '/flashcards/historico' },
  { id: 'desempenho', label: 'Desempenho', desc: 'Estatísticas', icon: BarChart3, route: '/flashcards/progresso' },
];

const Flashcards = () => {
  const navigate = useNavigate();
  const { data: dash, isLoading: loadingDash } = useFlashcardsDashboard();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();

  const [filtroAberto, setFiltroAberto] = useState(false);
  const [viewMode, setViewMode] = useState<'decks' | 'grade'>('decks');
  const [buscaMateria, setBuscaMateria] = useState('');
  const loading = loadingDash;

  const areas = useMemo(() => {
    return areasRaw && areasRaw.length > 0 ? areasRaw : FALLBACK_FLASHCARDS_AREAS;
  }, [areasRaw]);

  const materiasFiltradas = useMemo(() => {
    if (!buscaMateria.trim()) return areas;
    const q = buscaMateria.trim().toLowerCase();
    return areas.filter(a => a.area.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q));
  }, [areas, buscaMateria]);

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
      
      <div className="relative z-10">
        <PageHeader title="Flashcards" onBack={() => navigate('/')} />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">


        <div className="-mx-3 sm:-mx-6 lg:-mx-8 mb-6 mt-1">
          <FlashcardsCargoHero 
            pct={pct} 
            total={dash?.estudados || 0} 
            hoje={dash?.hoje || 0} 
            meta={100} 
            disponiveis={dash?.total_cards || 78077} 
            streak={dash?.streak || 0}
          />
        </div>
        
        <div className="pt-1 space-y-6">
          {/* ── Card Principal com Botão "Filtro Rápido" ───────────────── */}
          <div className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#36AF85]" />
              <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Praticar Flashcards</h2>
            </div>
            <p className="ml-3 mt-1 text-xs text-muted-foreground">
              Escolha filtros personalizados e comece sua rotina de revisão.
            </p>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { haptic.selection(); setFiltroAberto(true); }}
              className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#2C9570] hover:bg-[#237A5C] text-white text-base sm:text-lg font-black shadow-xl shadow-[#2C9570]/35 transition-colors focus-visible:outline-none border border-[#2C9570]/30"
            >
              <Filter className="h-6 w-6 text-white" strokeWidth={2} />
              <span className="tracking-wide text-white">Filtro Rápido</span>
              <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </motion.button>
          </div>



          {/* ── 4 Cards de Ações Rápidas (Decks, Revisão, Histórico, Desempenho) ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-[#36AF85]" />
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



          {/* ── Seção de Matérias e Trilhas (Decks 3D / Grade Completa) ───────────────────── */}
          <section className="pt-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-[#36AF85]" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Matérias e Trilhas ({areas.length})
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Alternador de Modo: Decks 3D vs Grade */}
                <div className="flex items-center rounded-xl bg-card/80 border border-border/80 p-0.5 shadow-sm backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => { haptic.selection(); setViewMode('decks'); }}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      viewMode === 'decks'
                        ? "bg-[#36AF85] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Visualizar em Decks 3D"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Decks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { haptic.selection(); setViewMode('grade'); }}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      viewMode === 'grade'
                        ? "bg-[#36AF85] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Visualizar em Lista de Matérias"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lista</span>
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'decks' ? (
              <FlashcardsMasterDeck areas={areas} />
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={buscaMateria}
                    onChange={(e) => setBuscaMateria(e.target.value)}
                    placeholder="Filtrar matérias (ex: Penal, Civil, Constitucional)..."
                    className="h-10 pl-9 rounded-xl border-border/80 bg-card/60 backdrop-blur-md text-xs"
                  />
                  {buscaMateria && (
                    <button
                      onClick={() => setBuscaMateria('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {materiasFiltradas.map((area) => {
                    const iconInfo = areaIconFor(area.slug || area.area);
                    const AreaIcon = iconInfo?.Icon || BookOpen;
                    const palette = getAreaThemePalette(area.slug || area.area);
                    const coverInfo = getAreaCover(area.area) || getAreaCover(area.slug);
                    const coverUrl = coverInfo?.cover;

                    return (
                      <motion.button
                        key={area.slug || area.area}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          haptic.selection();
                          navigate(`/flashcards/area/${area.slug || area.area}`);
                        }}
                        className="group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 hover:border-zinc-400/50 transition-all text-left overflow-hidden shadow-sm min-h-[140px] focus-visible:outline-none"
                        style={{
                          background: coverUrl
                            ? `linear-gradient(to top, rgba(10,10,12,0.95) 0%, rgba(10,10,12,0.7) 60%, rgba(10,10,12,0.45) 100%), url(${coverUrl}) center/cover no-repeat`
                            : `linear-gradient(145deg, ${palette.primary}22 0%, #141416 100%)`
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 z-10 w-full">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/10 shadow-sm"
                            style={{ backgroundColor: `${iconInfo?.color || '#36AF85'}22` }}
                          >
                            <AreaIcon className="w-4 h-4" style={{ color: iconInfo?.color || '#36AF85' }} strokeWidth={2.2} />
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white/90 border border-white/10 shrink-0">
                            {area.total_cards > 0 ? `${area.total_cards} cards` : 'Em breve'}
                          </span>
                        </div>

                        <div className="z-10 mt-3 w-full">
                          <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-[#36AF85] transition-colors">
                            {area.area}
                          </h3>
                          {area.compreendidos > 0 ? (
                            <div className="mt-2 flex items-center gap-1.5">
                              <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#36AF85] h-full rounded-full"
                                  style={{ width: `${Math.min(100, Math.round((area.compreendidos / (area.total_cards || 1)) * 100))}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-muted-foreground font-semibold">
                                {area.compreendidos} dominados
                              </span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground mt-1 group-hover:text-zinc-300 transition-colors">
                              Começar revisão →
                            </p>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>




        </div>
      </div>

      <FlashcardsFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={(f) => {
          setFiltroAberto(false);
          const p = new URLSearchParams();
          if (f.objetivo === 'termos_juridicos') {
            p.set('areas', 'Termos Jurídicos');
            if (f.indice && f.indice.length && f.indice.length < 26) p.set('temas', f.indice.join('|'));
          } else {
            if (f.disciplinas && f.disciplinas.length) p.set('areas', f.disciplinas.join('|'));
            if (f.assuntos && f.assuntos.length) p.set('temas', f.assuntos.join('|'));
          }
          if (f.status && f.status.length) p.set('modo', f.status[0]);
          if (f.quantidade) p.set('limite', String(f.quantidade));
          
          navigate(`/flashcards/estudar?${p.toString()}`);
        }}
      />
    </div>
  );
};

export default Flashcards;
