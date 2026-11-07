import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X, Layers, Target, BarChart3, FolderPlus, RotateCcw, Filter, BookOpen, Scale, Gavel, Quote, Lightbulb, Clock, History, Dices, Route, Trophy } from 'lucide-react';
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
  const [filtroDisciplinaPrevia, setFiltroDisciplinaPrevia] = useState<string | undefined>();
  const [filtroPassoPrevio, setFiltroPassoPrevio] = useState<'disciplinas' | 'assuntos' | 'tipos' | 'status' | 'quantidade' | undefined>();
  const [areaSelecionadaModal, setAreaSelecionadaModal] = useState<FlashcardsAreaRow | null>(null);
  const loading = loadingDash;

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
          {/* ── Card Principal com Botão "Filtro Rápido" ───────────────── */}
          <div className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#36AF85]" />
              <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Praticar Flashcards</h2>
            </div>
            <p className="ml-3 mt-1 text-xs text-muted-foreground truncate">
              Escolha filtros por matéria, assunto e tipo para praticar.
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



          {/* ── Matérias de Flashcards (Grade de Disciplinas) ───────────────────── */}
          <section className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-[#36AF85]" />
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Matérias ({areas.length})
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {areas.map((area) => {
                const iconInfo = areaIconFor(area.slug || area.area);
                const AreaIcon = iconInfo?.Icon || BookOpen;

                return (
                  <motion.button
                    key={area.slug || area.area}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      haptic.selection();
                      setAreaSelecionadaModal(area);
                    }}
                    className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-850/80 backdrop-blur-md transition-all text-left overflow-hidden shadow-sm hover:shadow-md min-h-[142px] focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-2 z-10 w-full">
                      <div className="relative shrink-0 flex items-center justify-center p-0.5">
                        <AreaIcon
                          className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-300 group-hover:text-white transition-all duration-200 group-hover:scale-110"
                          strokeWidth={1.8}
                        />
                      </div>
                      <span
                        className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800/90 text-zinc-400 border border-zinc-700/50 shrink-0"
                        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
                      >
                        {area.total_cards > 0 ? `${area.total_cards.toLocaleString('pt-BR')} cards` : 'Em breve'}
                      </span>
                    </div>

                    <div className="z-10 mt-3 w-full">
                      <p
                        className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-white transition-colors"
                        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                      >
                        {area.area}
                      </p>
                      {area.compreendidos > 0 ? (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-zinc-300 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.round((area.compreendidos / (area.total_cards || 1)) * 100))}%` }}
                            />
                          </div>
                          <span
                            className="text-[10px] sm:text-[11px] text-zinc-400 font-medium shrink-0"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {area.compreendidos} dominados
                          </span>
                        </div>
                      ) : (
                        <p
                          className="text-[11px] sm:text-xs text-zinc-500 mt-2 group-hover:text-zinc-300 transition-colors flex items-center gap-1 font-medium"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          <span>Começar revisão</span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                        </p>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>




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
                    <div className="w-10 h-10 rounded-xl bg-[#36AF85]/15 border border-[#36AF85]/30 flex items-center justify-center text-[#36AF85] group-hover:scale-105 transition-transform">
                      <Filter className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#36AF85] transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
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
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#2C9570] hover:bg-[#237A5C] border border-[#2C9570]/40 text-left text-white shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Route className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Ir para as Trilhas
                      </p>
                      <p className="text-[11px] text-emerald-100/80">
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
