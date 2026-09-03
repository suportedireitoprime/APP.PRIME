import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X, Layers, Target, BarChart3, FolderPlus, RotateCcw, Filter, BookOpen, Scale, Gavel, Quote, Lightbulb, Clock, History, Dices, Route, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import FlashcardsCargoHero from '@/components/flashcards/FlashcardsCargoHero';
import { useFlashcardsDashboard, useFlashcardsResumoAreas, FlashcardsAreaRow, FlashcardsDash } from '@/lib/flashcardsQueries';
import FlashcardsFiltroSheet, { FlashcardsFiltro } from '@/components/flashcards/FlashcardsFiltroSheet';
import ShapeGrid from '@/components/ui/ShapeGrid';


const ATALHOS_FLASHCARDS_4 = [
  { id: 'historico', label: 'Histórico', desc: 'Sessões salvas', icon: History, route: '/flashcards/historico' },
  { id: 'decks', label: 'Decks', desc: 'Seus baralhos', icon: FolderPlus, route: '/flashcards/decks' },
  { id: 'revisar', label: 'Revisão', desc: 'Volte no que errou', icon: RotateCcw, route: '/flashcards/revisar' },
  { id: 'desempenho', label: 'Desempenho', desc: 'Estatísticas', icon: BarChart3, route: '/flashcards/progresso' },
];

const Flashcards = () => {
  const navigate = useNavigate();
  const { data: dash, isLoading: loadingDash } = useFlashcardsDashboard();
  const { data: areasRaw } = useFlashcardsResumoAreas();

  const [filtroAberto, setFiltroAberto] = useState(false);
  const [diasFrequencia, setDiasFrequencia] = useState<7 | 15 | 30>(30);
  const [expandedFrequencia, setExpandedFrequencia] = useState(false);
  const loading = loadingDash;

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
            disponiveis={dash?.total_cards || 0} 
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



          {/* ── 4 Cards (Histórico, Decks, Revisão, Desempenho) ── */}
          <motion.div 
            className="grid grid-cols-4 gap-2.5"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
          >
            {ATALHOS_FLASHCARDS_4.map((a) => {
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
                  className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#36AF85]/50 transition-colors gap-2 text-center focus-visible:outline-none"
                >
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#36AF85] transition-all duration-300 group-hover:scale-110" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-foreground leading-tight">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{a.desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ── Recursos (Trilhas e Desafios um do lado do outro) ───────────────────── */}
          <section className="space-y-3 pt-2">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              Recursos
            </p>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { haptic.selection(); navigate('/flashcards/trilhas'); }}
                className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#36AF85]/50 transition-all focus-visible:outline-none text-center"
              >
                <div className="flex items-center justify-center text-[#36AF85] group-hover:scale-110 transition-transform">
                  <Route className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-foreground">Trilhas</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Guiadas passo a passo</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { haptic.selection(); navigate('/flashcards/desafios'); }}
                className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#36AF85]/50 transition-all focus-visible:outline-none text-center"
              >
                <div className="flex items-center justify-center text-[#36AF85] group-hover:scale-110 transition-transform">
                  <Trophy className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-foreground">Desafios</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">Em linha do tempo</span>
                </div>
              </motion.button>
            </div>
          </section>

          {/* ── Atividade Recente (Heatmap SRS) ───────────────────── */}
          {dash?.atividade_30d && dash.atividade_30d.length > 0 && (
            <section className="space-y-3 pt-2">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-between">
                Sua Frequência ({diasFrequencia} dias)
              </p>
              <div className="flex bg-card/60 border border-border/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm">
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {dash.atividade_30d.slice(-diasFrequencia).map((dia, idx) => {
                      // intensity based on total cards reviewed
                      let bg = 'bg-muted/50';
                      let text = 'text-muted-foreground/40';
                      if (dia.total > 0 && dia.total < 20) { bg = 'bg-[#36AF85]/30'; text = 'text-[#36AF85]/80'; }
                      else if (dia.total >= 20 && dia.total < 50) { bg = 'bg-[#36AF85]/60'; text = 'text-[#0d0f12]/60'; }
                      else if (dia.total >= 50) { bg = 'bg-[#36AF85]'; text = 'text-[#0d0f12]/80'; }
                      
                      const dt = dia.dia.split('-');
                      const abrev = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][new Date(Number(dt[0]), Number(dt[1])-1, Number(dt[2])).getDay()];
                      
                      return (
                        <div 
                          key={idx} 
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${bg} ${text}`} 
                          title={`${dia.dia}: ${dia.total} revisões`}
                        >
                          {abrev}
                        </div>
                      );
                    })}
                  </div>
                  {expandedFrequencia && (
                     <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-border/50">
                        {[7, 15, 30].map(n => (
                           <button key={n} onClick={() => { setDiasFrequencia(n as any); setExpandedFrequencia(false); haptic.selection(); }}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${diasFrequencia === n ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                             {n} dias
                           </button>
                        ))}
                     </div>
                  )}
                  <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground font-medium px-1">
                    <span>{diasFrequencia} dias atrás</span>
                    <div className="flex items-center gap-1">
                      <span>Menos</span>
                      <div className="flex gap-0.5 mx-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-muted/50" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#36AF85]/30" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#36AF85]/60" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-[#36AF85]" />
                      </div>
                      <span>Mais</span>
                    </div>
                    <span>Hoje</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => { haptic.selection(); setExpandedFrequencia(!expandedFrequencia); }}
                  className="w-8 shrink-0 flex flex-col items-center justify-center bg-[#0d0f12] text-white/90 border-l border-border/50 hover:bg-black transition-colors"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest leading-[1.2] py-4">
                    V<br/>E<br/>R
                  </span>
                </button>
              </div>
            </section>
          )}


        </div>
      </div>

      <FlashcardsFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={(f) => {
          setFiltroAberto(false);
          const p = new URLSearchParams();
          if (f.disciplinas.length) p.set('areas', f.disciplinas.join('|'));
          if (f.assuntos.length) p.set('temas', f.assuntos.join('|'));
          if (f.status.length) p.set('modo', f.status[0]);
          if (f.quantidade) p.set('limite', String(f.quantidade));
          
          navigate(`/flashcards/estudar?${p.toString()}`);
        }}
      />
    </div>
  );
};

export default Flashcards;
