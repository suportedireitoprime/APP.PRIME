import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  RotateCcw, BarChart3, ChevronRight, ListChecks, NotebookPen, 
  Search, X, Sparkles, Filter, History
} from 'lucide-react';
import QuestoesHero from '@/components/questoes/QuestoesHero';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import QuestoesFiltroSheet from '@/components/questoes/QuestoesFiltroSheet';
import { QuestoesMateriaSheet } from '@/components/questoes/QuestoesMateriaSheet';
import { Input } from '@/components/ui/input';
import { haptic } from '@/lib/nativeHaptics';
import { visualDaArea } from '@/lib/questoesVisual';
import { useQuestoesCargos, useQuestoesDesempenho, useQuestoesAreas } from '@/hooks/useQuestoes';
import { renderToStaticMarkup } from 'react-dom/server';

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
  const { areas, loading: loadingAreas } = useQuestoesAreas();

  const [filtroAberto, setFiltroAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [materiaSheet, setMateriaSheet] = useState<{ aberto: boolean; materia: string | null }>({ aberto: false, materia: null });
  const [buscaAberta, setBuscaAberta] = useState(false);

  const pct = dados?.total ? Math.round((dados.acertos / dados.total) * 100) : 0;
  const disponiveis = cargos.reduce((s, c) => s + (c.total_questoes ?? 0), 0);

  const displayedAreas = useMemo(() => {
    if (!busca) return areas;
    const term = busca.toLowerCase();
    return areas.filter(a => a.area.toLowerCase().includes(term));
  }, [areas, busca]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusca(e.target.value);
  };

  return (
    <div className="theme-questoes min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl lg:max-w-7xl 2xl:max-w-[1600px] px-0 lg:px-8 pb-32">
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

          <div className="px-3.5 sm:px-6 lg:px-0 space-y-6">
          {/* ── Card Principal com Botão "Filtro Rápido" ───────────────── */}
          <div className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl">
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
          </div>

          {/* ── 4 Cards (Cadernos, Revisão, Desempenho, Histórico) ── */}
          <motion.div 
            className="grid grid-cols-4 gap-2.5"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
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

          {/* ── Seção de Áreas / Disciplinas ───────────────────── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-primary" />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Escolher Matéria ({areas.length})
                </p>
              </div>
              <button
                onClick={() => {
                  haptic.selection();
                  setBuscaAberta((v) => !v);
                  if (buscaAberta) setBusca('');
                }}
                aria-label={buscaAberta ? 'Fechar busca' : 'Buscar matéria'}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {buscaAberta ? <X className="h-4.5 w-4.5" /> : <Search className="h-4.5 w-4.5" />}
              </button>
            </div>

            {buscaAberta && (
              <Input
                value={busca}
                onChange={handleSearch}
                placeholder="Buscar matéria..."
                className="h-11 rounded-2xl border-border bg-card shadow-sm text-xs font-bold"
              />
            )}

            {loadingAreas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl animate-pulse border border-border/60 bg-muted/40" />
                ))}
              </div>
            ) : areas.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground text-xs">
                <Sparkles className="mx-auto mb-2 h-7 w-7 text-primary" />
                Nenhuma matéria encontrada.
              </div>
            ) : (
              <div className="mt-6 flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 hide-scrollbar -mx-4 px-4">
                {displayedAreas.map((a) => {
                  const { icon: Icon, color } = visualDaArea(a.area);
                  const totalFormatted = Number(a.total).toLocaleString('pt-BR');
                  return (
                    <button
                      key={a.area}
                      onClick={() => {
                        haptic.selection();
                        setMateriaSheet({ aberto: true, materia: a.area });
                      }}
                      className="snap-start shrink-0 w-32 group text-left active:scale-95 transition-transform"
                    >
                      <div className="aspect-square w-full rounded-[2rem] bg-zinc-950 border border-white/10 flex items-center justify-center mb-3 group-hover:border-white/20 transition-colors">
                        <Icon size={48} color={color} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <h3 className="font-bold text-white text-xs leading-tight line-clamp-2">{a.area}</h3>
                      <p className="text-[10px] text-zinc-400 mt-1">{totalFormatted} questões</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      <QuestoesBottomNav />

      {/* Filtro completo */}
      <QuestoesFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={() => {
          setFiltroAberto(false);
          navigate('/questoes/praticar?filtro=1');
        }}
      />
      <QuestoesMateriaSheet
        materia={materiaSheet.materia}
        aberto={materiaSheet.aberto}
        onOpenChange={(aberto) => setMateriaSheet((p) => ({ ...p, aberto }))}
      />
    </div>
  );
};

export default Questoes;
