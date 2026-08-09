import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, PlayCircle, Route as RouteIcon, MapPin, CheckCircle2, ChevronRight, Settings2, Lightbulb, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useTrilhaStore } from '@/lib/trilhasStore';
import { loadConcursos, type ConcursoRow } from '@/lib/videoaulasStore';
import { haptic } from '@/lib/nativeHaptics';
import { slugify } from '@/lib/videoaulasCatalogos';
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from '@/components/ui/drawer';

// --- SETUP FASE 1: ESCOLHER EDITAL ---
const SetupEdital = ({ concursos, onSelect }: { concursos: ConcursoRow[], onSelect: (id: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="w-full flex flex-col pt-4 px-4 pb-32"
  >
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
        <Target className="w-10 h-10 text-primary" />
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50" />
      </div>
      <h2 className="text-2xl font-black text-foreground mb-2">Qual seu alvo?</h2>
      <p className="text-sm text-muted-foreground">Escolha o edital para montarmos seu plano de aprovação.</p>
    </div>

    <div className="space-y-4">
      {concursos.map(c => (
        <button
          key={c.id}
          onClick={() => {
            haptic.selection();
            onSelect(c.id);
          }}
          className="w-full relative overflow-hidden flex flex-col text-left rounded-3xl border border-border/40 bg-card/60 shadow-lg shadow-black/5 hover:border-primary/50 transition-all active:scale-[0.98]"
        >
          <div className="h-28 w-full relative bg-muted">
            <img src={c.capa} className="absolute inset-0 w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-sm font-bold uppercase leading-tight mb-1">{c.titulo}</p>
              <p className="text-xs text-white/70 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> {c.disciplinas?.length || 0} disciplinas
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </motion.div>
);

// --- SETUP FASE 2: RITMO/PRAZO ---
const SetupRitmo = ({ editalId, concursos, onBack, onFinish }: { editalId: string, concursos: ConcursoRow[], onBack: () => void, onFinish: (dias: number) => void }) => {
  const edital = concursos.find(c => c.id === editalId);
  const [dias, setDias] = useState(30);

  const opcoesDias = [15, 30, 45, 90];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col pt-4 px-4 pb-32"
    >
      <button onClick={onBack} className="self-start p-2 mb-4 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Prazo da Missão</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Em quanto tempo você quer bater o edital <strong className="text-foreground">{edital?.titulo}</strong>?
        </p>

        <div className="grid grid-cols-2 gap-3 mt-8">
          {opcoesDias.map(num => (
            <button
              key={num}
              onClick={() => {
                haptic.selection();
                setDias(num);
              }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                dias === num ? 'border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20' : 'border-border/50 bg-card/60 backdrop-blur hover:border-primary/50'
              }`}
            >
              <span className={`text-2xl font-black ${dias === num ? 'text-primary' : 'text-foreground'}`}>
                {num}
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${dias === num ? 'text-primary/80' : 'text-muted-foreground'}`}>
                Dias
              </span>
              {dias === num && <CheckCircle2 className="w-5 h-5 text-primary absolute top-2 right-2" />}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            haptic.success();
            onFinish(dias);
          }}
          className="w-full mt-10 bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all active:scale-95"
        >
          Gerar Minha Trilha
        </button>
      </div>
    </motion.div>
  );
};

// --- MAPA DA TRILHA (FLUIDO E ELEGANTE) ---
const TrilhaMap = ({ concursos }: { concursos: ConcursoRow[] }) => {
  const navigate = useNavigate();
  const { trilhaAtiva, limparTrilha, marcarDiaConcluido, desmarcarDiaConcluido } = useTrilhaStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const edital = useMemo(() => concursos.find(c => c.id === trilhaAtiva?.editalId), [concursos, trilhaAtiva]);

  // Geração de Nodos com base na Meta de Dias
  const nodos = useMemo(() => {
    if (!edital || !trilhaAtiva) return [];
    const diasList = [];
    let dIndex = 0;
    const disc = edital.disciplinas || ['Disciplinas Gerais'];
    
    // Distribui 2 disciplinas por dia. Pode ser adaptado se necessário.
    const aulasPorDia = 2; 

    for (let i = 0; i < trilhaAtiva.diasMeta; i++) {
      const selecionadas = [];
      for(let a=0; a < aulasPorDia; a++){
        selecionadas.push(disc[dIndex % disc.length]);
        dIndex++;
      }
      diasList.push({ dia: i + 1, disciplinas: selecionadas });
    }
    return diasList;
  }, [edital, trilhaAtiva]);

  if (!edital || !trilhaAtiva) return null;

  const totalConcluido = trilhaAtiva.diasConcluidos.length;
  const progressoPct = Math.round((totalConcluido / trilhaAtiva.diasMeta) * 100);

  return (
    <div className="w-full pb-32">
      {/* Header Sticky Gamificado */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-0.5">Missão: {trilhaAtiva.diasMeta} Dias</p>
          <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{edital.titulo}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-primary">{progressoPct}%</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressoPct}%` }} />
            </div>
          </div>
          <button 
            onClick={() => {
              haptic.selection();
              setDrawerOpen(true);
            }}
            className="p-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* O MAPA FLUIDO */}
      <div className="px-4 py-10 relative overflow-hidden">
        {/* Linha vertical central brilhante (O Caminho) */}
        <div className="absolute left-1/2 top-10 bottom-10 w-1.5 bg-white/5 -translate-x-1/2 z-0 rounded-full overflow-hidden">
          {/* Preenchimento do progresso na linha */}
          <div 
            className="w-full bg-primary/80 transition-all duration-700 ease-in-out" 
            style={{ height: `${(totalConcluido / trilhaAtiva.diasMeta) * 100}%`, boxShadow: '0 0 10px rgba(var(--primary), 0.5)' }} 
          />
        </div>

        <div className="space-y-10">
          {nodos.map((nodo, i) => {
            const concluido = trilhaAtiva.diasConcluidos.includes(nodo.dia);
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={nodo.dia}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
              >
                {/* Conector Pontilhado Opcional (Mais elegante que linha dura) */}
                <div className={`absolute top-1/2 w-[calc(50%-2.5rem)] h-[2px] border-b-2 border-dotted -translate-y-1/2 z-0 ${concluido ? 'border-primary/40' : 'border-white/10'} ${isLeft ? 'left-1/2' : 'right-1/2'}`} />

                {/* Bolinha Central Brilhante */}
                <button
                  onClick={() => {
                    haptic.selection();
                    if(concluido) {
                      desmarcarDiaConcluido(nodo.dia);
                    } else {
                      marcarDiaConcluido(nodo.dia);
                    }
                  }}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-20 flex items-center justify-center transition-all duration-300 ${
                    concluido 
                      ? 'bg-primary border-4 border-background shadow-[0_0_15px_rgba(var(--primary),0.6)] scale-110' 
                      : 'bg-[#1A1A1A] border-4 border-background text-muted-foreground'
                  }`}
                >
                  {concluido ? (
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <span className="text-[11px] font-black">{nodo.dia}</span>
                  )}
                </button>

                {/* Cartão de Conteúdo Glassmorphism */}
                <div 
                  className={`w-[45%] rounded-3xl p-4 relative z-30 transition-all duration-300 backdrop-blur-md border ${
                    concluido 
                      ? 'bg-primary/5 border-primary/20 shadow-sm opacity-80' 
                      : 'bg-card/40 border-white/10 shadow-lg hover:border-white/20 hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${concluido ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      Dia {nodo.dia}
                    </p>
                    {/* Dica para encorajar (apenas nos primeiros ou últimos nós para não poluir) */}
                    {(nodo.dia === 1 || nodo.dia === trilhaAtiva.diasMeta) && !concluido && (
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500/70 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="space-y-2.5">
                    {nodo.disciplinas.map((disc, idx) => (
                      <button 
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.light();
                          navigate(`/videoaulas/areas/${slugify(disc)}`);
                        }}
                        className="flex flex-col gap-1 w-full text-left group"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${concluido ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-primary/20'}`}>
                            <PlayCircle className={`w-3 h-3 ${concluido ? 'text-primary' : 'text-foreground/70 group-hover:text-primary'}`} />
                          </div>
                          <p className={`text-[11px] font-semibold line-clamp-2 leading-tight ${concluido ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                            {disc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Drawer de Configurações */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <DrawerContent className="bg-card border-t border-white/10 flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
            <div className="p-6">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />
              <h3 className="text-xl font-black mb-2">Ajustes da Missão</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Você definiu o prazo de <strong className="text-foreground">{trilhaAtiva.diasMeta} dias</strong> para o edital {edital.titulo}.
              </p>
              
              <button
                onClick={() => {
                  haptic.medium();
                  limparTrilha();
                  setDrawerOpen(false);
                }}
                className="w-full bg-destructive/10 text-destructive font-bold py-4 rounded-2xl hover:bg-destructive/20 transition-colors active:scale-[0.98]"
              >
                Abortar e Refazer Trilha
              </button>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </div>
  );
};

const VideoaulasTrilhas = () => {
  const navigate = useNavigate();
  const [concursos, setConcursos] = useState<ConcursoRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado local para o fluxo de setup
  const [setupStep, setSetupStep] = useState<'edital' | 'ritmo'>('edital');
  const [selectedEdital, setSelectedEdital] = useState<string | null>(null);

  const { trilhaAtiva, setTrilhaAtiva } = useTrilhaStore();

  useEffect(() => {
    let alive = true;
    loadConcursos().then((c) => {
      if (!alive) return;
      setConcursos(c.filter(x => x.disciplinas?.length > 0)); // Apenas concursos com disciplinas
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {!trilhaAtiva && (
        <PageHeader
          title="Montar Trilha"
          subtitle="Cronograma Inteligente"
          onBack={() => navigate('/videoaulas/categorias')}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {!trilhaAtiva ? (
            setupStep === 'edital' ? (
              <SetupEdital key="edital" concursos={concursos} onSelect={(id) => {
                setSelectedEdital(id);
                setSetupStep('ritmo');
              }} />
            ) : (
              <SetupRitmo 
                key="ritmo" 
                editalId={selectedEdital!} 
                concursos={concursos} 
                onBack={() => setSetupStep('edital')}
                onFinish={(dias) => {
                  setTrilhaAtiva({
                    editalId: selectedEdital!,
                    diasMeta: dias,
                    diasConcluidos: [],
                    dataInicio: new Date().toISOString()
                  });
                }} 
              />
            )
          ) : (
            <motion.div key="mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TrilhaMap concursos={concursos} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default VideoaulasTrilhas;
