import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X, Layers, Target, BarChart3, FolderPlus, RotateCcw, Filter, BookOpen, Scale, Gavel, Quote, Lightbulb, Clock, History, Dices, Route, Trophy, LayoutGrid, List, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import FlashcardsCargoHero from '@/components/flashcards/FlashcardsCargoHero';
import { useFlashcardsDashboard, useFlashcardsResumoAreas, FlashcardsAreaRow, FlashcardsDash } from '@/lib/flashcardsQueries';
import { FALLBACK_FLASHCARDS_AREAS } from '@/lib/flashcardsConstants';
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { cn } from '@/lib/utils';
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
  const [activeFilterSlide, setActiveFilterSlide] = useState(0);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const loading = loadingDash;

  const scrollToSlide = (idx: number) => {
    haptic.selection();
    setActiveFilterSlide(idx);
    if (scrollerRef.current) {
      const width = scrollerRef.current.clientWidth;
      scrollerRef.current.scrollTo({
        left: idx * (width + 16),
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const width = el.clientWidth;
    if (width > 0) {
      const idx = Math.round(el.scrollLeft / width);
      if (idx !== activeFilterSlide && (idx === 0 || idx === 1)) {
        setActiveFilterSlide(idx);
      }
    }
  };

  const areas = useMemo(() => {
    return areasRaw && areasRaw.length > 0 ? areasRaw : FALLBACK_FLASHCARDS_AREAS;
  }, [areasRaw]);

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
          {/* ── Carrossel de Filtros: Filtro Rápido & Cargos ───────────────── */}
          <div className="space-y-2.5">
            {/* Abas e Controles de Navegação do Carrossel */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card/70 border border-border/70 backdrop-blur-md shadow-sm">
                <button
                  type="button"
                  onClick={() => scrollToSlide(0)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                    activeFilterSlide === 0
                      ? "bg-[#36AF85] text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filtro Rápido</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSlide(1)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                    activeFilterSlide === 1
                      ? "bg-amber-500 text-zinc-950 shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Por Cargos</span>
                </button>
              </div>

              {/* Dots Indicadores de Slide */}
              <div className="flex items-center gap-1.5 px-2">
                <button
                  type="button"
                  onClick={() => scrollToSlide(0)}
                  aria-label="Slide Filtro Rápido"
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    activeFilterSlide === 0 ? "w-6 bg-[#36AF85]" : "w-2 bg-zinc-700 hover:bg-zinc-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => scrollToSlide(1)}
                  aria-label="Slide Cargos"
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    activeFilterSlide === 1 ? "w-6 bg-amber-500" : "w-2 bg-zinc-700 hover:bg-zinc-500"
                  )}
                />
              </div>
            </div>

            {/* Scroller Horizontal com Snap */}
            <div
              ref={scrollerRef}
              onScroll={handleScroll}
              className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth gap-3.5 rounded-3xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Slide 1: Filtro Rápido */}
              <div className="w-full shrink-0 snap-center bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-[#36AF85]" />
                  <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">
                    Praticar Flashcards
                  </h2>
                </div>
                <p className="ml-3 mt-1 text-xs text-muted-foreground">
                  Escolha filtros personalizados por matéria, assunto e tipos para começar.
                </p>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { haptic.selection(); setFiltroAberto(true); }}
                  className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#2C9570] hover:bg-[#237A5C] text-white text-base sm:text-lg font-black shadow-md transition-colors focus-visible:outline-none border border-[#2C9570]/30"
                >
                  <Filter className="h-6 w-6 text-white" strokeWidth={2} />
                  <span className="tracking-wide text-white">Filtro Rápido</span>
                  <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </motion.button>
              </div>

              {/* Slide 2: Por Cargos */}
              <div className="w-full shrink-0 snap-center bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-1 rounded-full bg-amber-500" />
                  <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">
                    Flashcards por Cargo
                  </h2>
                </div>
                <p className="ml-3 mt-1 text-xs text-muted-foreground">
                  Estude focado no edital: Magistratura, MP, Delegado, Defensoria, PRF e mais.
                </p>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { haptic.selection(); navigate('/flashcards/cargos'); }}
                  className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-base sm:text-lg font-black shadow-md transition-all focus-visible:outline-none border border-amber-500/30"
                >
                  <Briefcase className="h-6 w-6 text-white" strokeWidth={2} />
                  <span className="tracking-wide text-white">Ver Cargos e Editais</span>
                  <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
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



          {/* ── Decks 3D de Flashcards por Disciplina ───────────────────── */}
          <section className="pt-1">
            <FlashcardsMasterDeck areas={areas} />
          </section>




        </div>
      </div>

      <FlashcardsFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={(f) => {
          setFiltroAberto(false);
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
