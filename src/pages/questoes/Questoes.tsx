import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  RotateCcw, BarChart3, ChevronRight, ListChecks, NotebookPen, 
  Filter, History, BookOpen
} from 'lucide-react';
import QuestoesHero from '@/components/questoes/QuestoesHero';
import QuestoesFiltroSheet from '@/components/questoes/QuestoesFiltroSheet';
import { haptic } from '@/lib/nativeHaptics';
import { useQuestoesCargos, useQuestoesDesempenho, useQuestoesAreas } from '@/hooks/useQuestoes';
import QuestoesMasterDeck from '@/components/questoes/QuestoesMasterDeck';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { FALLBACK_FLASHCARDS_AREAS } from '@/lib/flashcardsConstants';
import { areaIconFor } from '@/lib/areasDireitoIcons';

const ATALHOS_4 = [
  { id: 'historico', label: 'Histórico', desc: 'Sessões salvas', icon: History, route: '/questoes/historico' },
  { id: 'cadernos', label: 'Cadernos', desc: 'Blocos de estudo', icon: NotebookPen, route: '/questoes/cadernos' },
  { id: 'revisar', label: 'Revisão', desc: 'Volte no que errou', icon: RotateCcw, route: '/questoes/revisar' },
  { id: 'desempenho', label: 'Desempenho', desc: 'Números por área', icon: BarChart3, route: '/questoes/desempenho' },
];

const Questoes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cargos } = useQuestoesCargos();
  const { dados } = useQuestoesDesempenho();
  const { areas: rawAreas } = useQuestoesAreas();

  const [filtroAberto, setFiltroAberto] = useState(false);
  const [areaFiltroSelecionada, setAreaFiltroSelecionada] = useState<string | null>(null);

  const materiasAreas = useMemo(() => {
    const counts: Record<string, number> = {};
    (rawAreas || []).forEach((a) => {
      counts[a.area] = a.total;
    });

    return FALLBACK_FLASHCARDS_AREAS.map((f) => ({
      area: f.area,
      slug: f.slug,
      total_questoes: counts[f.area] || counts[f.area.replace('Direito ', '')] || 0,
    })).sort((a, b) => b.total_questoes - a.total_questoes);
  }, [rawAreas]);

  const pct = dados?.total ? Math.round((dados.acertos / dados.total) * 100) : 0;
  const disponiveis = cargos.reduce((s, c) => s + (c.total_questoes ?? 0), 0);

  return (
    <div className="theme-questoes min-h-screen bg-background relative overflow-hidden">
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
          {/* ── Banner de Desempenho ───────────────── */}
          <div className="w-full">
            <QuestoesHero
              pct={pct}
              total={dados?.total ?? 0}
              hoje={dados?.hoje ?? 0}
              acertos={dados?.acertos ?? 0}
              disponiveis={disponiveis}
              onBack={() => navigate('/')}
            />
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
            }}
            initial="hidden" animate="show"
            className="px-3.5 sm:px-6 lg:px-0 space-y-6"
          >
          {/* ── Card Principal com Botão "Filtro Rápido" ───────────────── */}
          <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl">Praticar Questões</h2>
            </div>
            <p className="ml-3 mt-1 text-xs text-muted-foreground">
              Escolha filtros personalizados e comece sua rotina de resolução.
            </p>

            <motion.button
              key={location.key}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { haptic.selection(); setFiltroAberto(true); }}
              className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-hero-panel hover:brightness-110 text-white text-base sm:text-lg font-black shadow-xl shadow-black/40 transition-all focus-visible:outline-none border border-[#E11D48]/30 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]"
            >
              <Filter className="h-6 w-6 text-white drop-shadow-md" strokeWidth={2.5} />
              <span className="tracking-wide text-white">Filtro Rápido</span>
              <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1 drop-shadow-md" strokeWidth={2.5} />
            </motion.button>
          </motion.div>

          {/* ── 4 Cards (Cadernos, Revisão, Desempenho, Histórico) ── */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
          >
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
            }}
            initial="hidden" animate="show"
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
                  onClick={() => { haptic.selection(); navigate(a.route); }}
                  className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-zinc-400/50 transition-colors gap-2 text-center focus-visible:outline-none"
                >
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-400 transition-all duration-300 group-hover:text-zinc-300 group-hover:scale-110" strokeWidth={2} />
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

          {/* ── Áreas do Direito (Grade de Trilhas) ───────────────────── */}
          <motion.section 
            variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} 
            className="space-y-3 pt-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-primary" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Áreas do Direito ({materiasAreas.length})
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                Toque para filtrar por área
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {materiasAreas.map((area) => {
                const iconInfo = areaIconFor(area.slug || area.area);
                const AreaIcon = iconInfo?.Icon || BookOpen;

                return (
                  <motion.button
                    key={area.slug || area.area}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      haptic.selection();
                      setAreaFiltroSelecionada(area.area);
                    }}
                    className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-primary/50 hover:bg-zinc-850/80 backdrop-blur-md transition-all text-left overflow-hidden shadow-sm hover:shadow-md min-h-[135px] focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-2 z-10 w-full">
                      <div className="relative shrink-0 flex items-center justify-center p-0.5">
                        <AreaIcon
                          className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-300 group-hover:text-primary transition-all duration-200 group-hover:scale-110"
                          strokeWidth={1.8}
                        />
                      </div>
                      <span
                        className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-400 border border-zinc-700/50 shrink-0"
                      >
                        {area.total_questoes > 0 ? `${area.total_questoes.toLocaleString('pt-BR')} q.` : 'Filtrar'}
                      </span>
                    </div>

                    <div className="z-10 mt-3 w-full">
                      <p
                        className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-white transition-colors"
                      >
                        {area.area}
                      </p>
                      <p
                        className="text-[11px] sm:text-xs text-zinc-500 mt-2 group-hover:text-primary transition-colors flex items-center gap-1 font-medium"
                      >
                        <span>Filtrar questões</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>


          </motion.div>
        </div>
      </div>

      {/* Filtro completo e Filtro Dedicado por Área */}
      <QuestoesFiltroSheet
        aberto={filtroAberto || Boolean(areaFiltroSelecionada)}
        disciplinaFixa={areaFiltroSelecionada || undefined}
        onFechar={() => {
          setFiltroAberto(false);
          setAreaFiltroSelecionada(null);
        }}
        onAplicar={(f) => {
          const areaParam = areaFiltroSelecionada ? `&area=${encodeURIComponent(areaFiltroSelecionada)}` : '';
          setFiltroAberto(false);
          setAreaFiltroSelecionada(null);
          navigate(`/questoes/praticar?filtro=1${areaParam}`);
        }}
      />
    </div>
  );
};

export default Questoes;
