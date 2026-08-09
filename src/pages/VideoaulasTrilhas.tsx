import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, PlayCircle, Route as RouteIcon, MapPin, CheckCircle2, ChevronRight, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { useTrilhaStore } from '@/lib/trilhasStore';
import { loadConcursos, type ConcursoRow } from '@/lib/videoaulasStore';
import { haptic } from '@/lib/nativeHaptics';
import { slugify } from '@/lib/videoaulasCatalogos';
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from '@/components/ui/drawer';

// Componente para a fase 1 de setup (Escolher Edital)
const SetupEdital = ({ concursos, onSelect }: { concursos: ConcursoRow[], onSelect: (id: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="w-full flex flex-col pt-4 px-4 pb-32"
  >
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <RouteIcon className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-black text-foreground mb-2">Qual seu foco?</h2>
      <p className="text-sm text-muted-foreground">Escolha o edital para montarmos seu cronograma de estudos personalizado.</p>
    </div>

    <div className="space-y-3">
      {concursos.map(c => (
        <button
          key={c.id}
          onClick={() => {
            haptic.selection();
            onSelect(c.id);
          }}
          className="w-full relative overflow-hidden flex flex-col text-left rounded-2xl border border-border bg-card shadow-sm hover:border-primary/50 transition-colors group"
        >
          <div className="h-24 w-full relative bg-black/10">
            <img src={c.capa} className="absolute inset-0 w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-3 left-3 text-white">
              <p className="text-sm font-bold uppercase">{c.titulo}</p>
              <p className="text-[10px] text-white/80">{c.disciplinas?.length || 0} disciplinas</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </motion.div>
);

// Componente para a fase 2 de setup (Ritmo)
const SetupRitmo = ({ editalId, concursos, onBack, onFinish }: { editalId: string, concursos: ConcursoRow[], onBack: () => void, onFinish: (aulas: number) => void }) => {
  const edital = concursos.find(c => c.id === editalId);
  const [aulas, setAulas] = useState(2);

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
        <h2 className="text-2xl font-black text-foreground mb-2">Seu Ritmo</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Para o edital <strong className="text-foreground">{edital?.titulo}</strong>, quantas aulas você consegue assistir por dia?
        </p>

        <div className="flex flex-col gap-3 mt-8">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => setAulas(num)}
              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                aulas === num ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <span className={`font-bold ${aulas === num ? 'text-primary' : 'text-foreground'}`}>
                {num} {num === 1 ? 'aula' : 'aulas'} por dia
              </span>
              {aulas === num && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            haptic.selection();
            onFinish(aulas);
          }}
          className="w-full mt-8 bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors active:scale-95"
        >
          Gerar Minha Trilha
        </button>
      </div>
    </motion.div>
  );
};

// O Mapa da Trilha
const TrilhaMap = ({ concursos }: { concursos: ConcursoRow[] }) => {
  const navigate = useNavigate();
  const { trilhaAtiva, limparTrilha, marcarDiaConcluido, desmarcarDiaConcluido } = useTrilhaStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const edital = useMemo(() => concursos.find(c => c.id === trilhaAtiva?.editalId), [concursos, trilhaAtiva]);

  // Gerar nós fictícios da trilha distribuindo disciplinas
  const nodos = useMemo(() => {
    if (!edital || !trilhaAtiva) return [];
    const dias = [];
    let dIndex = 0;
    const disc = edital.disciplinas || ['Disciplinas Gerais'];
    
    // Distribuir disciplinas nos dias, de acordo com as "aulas por dia"
    for (let i = 0; i < 20; i++) { // Gerar 20 dias para o roadmap
      const selecionadas = [];
      for(let a=0; a < trilhaAtiva.aulasPorDia; a++){
        selecionadas.push(disc[dIndex % disc.length]);
        dIndex++;
      }
      dias.push({
        dia: i + 1,
        disciplinas: selecionadas
      });
    }
    return dias;
  }, [edital, trilhaAtiva]);

  if (!edital || !trilhaAtiva) return null;

  return (
    <div className="w-full pb-32">
      {/* Header Sticky da Trilha */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-primary tracking-wider">Sua Trilha Ativa</p>
          <p className="text-sm font-bold text-foreground">{edital.titulo}</p>
        </div>
        <button 
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* Caminho da Forca / Roadmap */}
      <div className="px-4 py-8 relative">
        {/* Linha vertical central */}
        <div className="absolute left-1/2 top-10 bottom-10 w-1 bg-border -translate-x-1/2 z-0 rounded-full" />

        <div className="space-y-12">
          {nodos.map((nodo, i) => {
            const concluido = trilhaAtiva.diasConcluidos.includes(nodo.dia);
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={nodo.dia}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
              >
                {/* O conector horizontal até o centro */}
                <div className={`absolute top-1/2 w-[calc(50%-2rem)] h-1 bg-border -translate-y-1/2 z-0 ${isLeft ? 'left-1/2' : 'right-1/2'}`} />

                {/* Bolinha do Centro */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-background bg-card z-20 flex items-center justify-center shadow-sm">
                  {concluido ? (
                    <div className="w-full h-full bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">{nodo.dia}</span>
                  )}
                </div>

                {/* O Card do Dia */}
                <div 
                  className={`w-[45%] bg-card border ${concluido ? 'border-primary/50 opacity-70' : 'border-border shadow-md'} rounded-2xl p-3 relative z-30 transition-all hover:scale-105 active:scale-95`}
                  onClick={() => {
                    haptic.selection();
                    if(concluido) {
                      desmarcarDiaConcluido(nodo.dia);
                    } else {
                      marcarDiaConcluido(nodo.dia);
                      // Navegar para a primeira disciplina do dia
                      navigate(`/videoaulas/areas/${slugify(nodo.disciplinas[0])}`);
                    }
                  }}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${concluido ? 'text-primary' : 'text-muted-foreground'}`}>
                    Dia {nodo.dia}
                  </p>
                  <div className="space-y-1">
                    {nodo.disciplinas.map((disc, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <PlayCircle className="w-3 h-3 text-primary/70 shrink-0" />
                        <p className="text-[11px] font-semibold text-foreground line-clamp-1">{disc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/60 z-50" onClick={() => setDrawerOpen(false)} />
          <DrawerContent className="bg-card flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-50 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))]">
            <div className="p-4">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-6" />
              <h3 className="text-lg font-bold mb-4">Configurações da Trilha</h3>
              <p className="text-sm text-muted-foreground mb-6">Você está focado no edital {edital.titulo} com ritmo de {trilhaAtiva.aulasPorDia} aulas/dia.</p>
              
              <button
                onClick={() => {
                  haptic.impact();
                  limparTrilha();
                  setDrawerOpen(false);
                }}
                className="w-full bg-destructive/10 text-destructive font-bold py-3 rounded-xl hover:bg-destructive/20 transition-colors"
              >
                Refazer Trilha (Começar de Novo)
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
    <div className="min-h-screen bg-background">
      {!trilhaAtiva && (
        <PageHeader
          title="Montar Trilha"
          subtitle="Cronograma Inteligente"
          onBack={() => navigate('/videoaulas/categorias')}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
                onFinish={(aulas) => {
                  setTrilhaAtiva({
                    editalId: selectedEdital!,
                    aulasPorDia: aulas,
                    dataInicio: new Date().toISOString(),
                    diasConcluidos: []
                  });
                }}
              />
            )
          ) : (
            <TrilhaMap key="mapa" concursos={concursos} />
          )}
        </AnimatePresence>
      )}

      <VideoaulasBottomNav />
    </div>
  );
};

export default VideoaulasTrilhas;
