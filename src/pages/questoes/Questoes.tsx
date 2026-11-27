import { lazy, Suspense, useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RotateCcw, BarChart3, ChevronRight, NotebookPen,
  Filter, History, BookOpen, Play
} from 'lucide-react';
import QuestoesHero from '@/components/questoes/QuestoesHero';
import { haptic } from '@/lib/nativeHaptics';
import { useQuestoesCargos, useQuestoesDesempenho, useQuestoesAreas } from '@/hooks/useQuestoes';
import QuestoesMasterDeck from '@/components/questoes/QuestoesMasterDeck';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { useIsDesktop } from '@/hooks/use-desktop';
import { FALLBACK_FLASHCARDS_AREAS } from '@/lib/flashcardsConstants';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { recordAreaActivity } from '@/lib/continuity';

const QuestoesFiltroSheet = lazy(() => import('@/components/questoes/QuestoesFiltroSheet'));

const ATALHOS_4 = [
  { id: 'historico', label: 'Histórico', desc: 'Sessões salvas', icon: History, route: '/questoes/historico' },
  { id: 'cadernos', label: 'Cadernos', desc: 'Blocos de estudo', icon: NotebookPen, route: '/questoes/cadernos' },
  { id: 'revisar', label: 'Revisão', desc: 'Volte no que errou', icon: RotateCcw, route: '/questoes/revisar' },
  { id: 'desempenho', label: 'Desempenho', desc: 'Números por área', icon: BarChart3, route: '/questoes/desempenho' },
];

const Questoes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const { cargos } = useQuestoesCargos();
  const { dados } = useQuestoesDesempenho();
  const { areas: rawAreas } = useQuestoesAreas();

  const [filtroAberto, setFiltroAberto] = useState(false);
  const [areaFiltroSelecionada, setAreaFiltroSelecionada] = useState<string | null>(null);

  // Registra acesso para continuidade (BottomNav)
  useEffect(() => {
    recordAreaActivity({
      path: '/questoes',
      label: 'Questões',
      sublabel: 'Banco completo por matéria e banca',
      kind: 'questoes',
    });
  }, []);

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
    <div className="theme-questoes min-h-screen bg-[#09090B] relative overflow-hidden">
      {/* ── Fundo Animado com Quadradinhos apenas no mobile/tablet ── */}
      {!isDesktop && (
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
      )}

      <div className="relative z-10 mx-auto w-full max-w-3xl lg:max-w-[1380px] px-0 lg:px-10 lg:pt-6 pb-12">
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

          {/* ── Áreas do Direito — Lista Direta para Praticar ───────────────────── */}
          <motion.section 
            variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }} 
            className="space-y-3 pt-2"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-primary" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  Áreas do Direito ({materiasAreas.length})
                </p>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">
                Toque para praticar
              </span>
            </div>

            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md divide-y divide-white/[0.06] overflow-hidden shadow-lg">
              {materiasAreas.map((area, idx) => {
                const startAreaPractice = () => {
                  haptic.medium();
                  const targetPath = `/questoes/praticar?area=${encodeURIComponent(area.area)}`;
                  recordAreaActivity({
                    path: targetPath,
                    label: `Questões — ${area.area}`,
                    sublabel: area.total_questoes > 0
                      ? `${area.total_questoes.toLocaleString('pt-BR')} questões disponíveis`
                      : 'Praticar por área',
                    kind: 'questoes',
                  });
                  navigate(targetPath);
                };

                return (
                  <div
                    key={area.slug || area.area}
                    onClick={startAreaPractice}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        startAreaPractice();
                      }
                    }}
                    className="group flex items-center gap-3.5 px-4 py-3.5 sm:px-5 sm:py-4 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-white/[0.05]"
                  >
                    {/* Número da trilha */}
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                      idx === 0 ? 'bg-amber-400 text-zinc-950 shadow-sm shadow-amber-400/20' :
                      idx === 1 ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/70' :
                      idx === 2 ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/70' :
                      'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Nome e contagem */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-[15px] font-bold text-white leading-snug group-hover:text-primary transition-colors">
                        {area.area}
                      </p>
                      <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 font-medium">
                        {area.total_questoes > 0
                          ? `${area.total_questoes.toLocaleString('pt-BR')} questões`
                          : 'Questões disponíveis'}
                      </p>
                    </div>

                    {/* Botão Pill Praticar */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startAreaPractice();
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-[13px] font-bold shadow-md shadow-primary/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Praticar
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.section>


          </motion.div>
        </div>
      </div>

      {/* Filtro completo e Filtro Dedicado por Área */}
      {(filtroAberto || Boolean(areaFiltroSelecionada)) && (
        <Suspense fallback={null}>
          <QuestoesFiltroSheet
            aberto={filtroAberto || Boolean(areaFiltroSelecionada)}
            disciplinaFixa={areaFiltroSelecionada || undefined}
            onFechar={() => {
              setFiltroAberto(false);
              setAreaFiltroSelecionada(null);
            }}
            onAplicar={() => {
              const areaParam = areaFiltroSelecionada ? `&area=${encodeURIComponent(areaFiltroSelecionada)}` : '';
              setFiltroAberto(false);
              setAreaFiltroSelecionada(null);
              navigate(`/questoes/praticar?filtro=1${areaParam}`);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Questoes;
