import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Target, Calendar, CheckCircle2, Route as RouteIcon, FileText, Smartphone, Search, Layers, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { useFlashcardsTrilhasStore, type FlashcardTrilhaAtiva } from '@/lib/flashcardsTrilhasStore';

// --- SETUP 1: ESCOLHER ÁREA ---
const SetupArea = ({ onSelect, onCancel }: { onSelect: (area: string) => void, onCancel: () => void }) => {
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.rpc('flashcards_resumo_areas').then(({ data }) => {
      if (alive) {
        if (data) setAreas((data as any[]).map((a) => a.area));
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col pb-32">
      <PageHeader title="Nova Trilha" subtitle="Escolha a Área" onBack={onCancel} />
      
      <div className="pt-4 px-4">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            <motion.button
              onClick={() => { haptic.selection(); onSelect('Todas as Áreas'); }}
              className="w-full flex items-center justify-between p-4 rounded-3xl border border-primary/40 bg-primary/5 shadow-sm hover:border-primary transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Todas as Áreas</p>
                  <p className="text-xs text-muted-foreground">Misturar todas as matérias</p>
                </div>
              </div>
            </motion.button>

            {areas.map(area => (
              <motion.button
                key={area}
                onClick={() => { haptic.selection(); onSelect(area); }}
                className="w-full flex items-center justify-between p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{area}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- SETUP 2: ESCOLHER TEMA ---
const SetupTema = ({ area, onSelect, onBack }: { area: string, onSelect: (tema: string) => void, onBack: () => void }) => {
  const [temas, setTemas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (area === 'Todas as Áreas') {
      onSelect('Todos os Temas');
      return;
    }
    const fetchTemas = async () => {
      const { data } = await supabase
        .from('flashcards_cards')
        .select('tema')
        .eq('area', area)
        .not('tema', 'is', null);
        
      if (alive) {
        if (data) {
          const uniqueTemas = Array.from(new Set(data.map(d => d.tema).filter(Boolean)));
          setTemas(uniqueTemas as string[]);
        }
        setLoading(false);
      }
    };
    fetchTemas();
    return () => { alive = false; };
  }, [area]);

  if (area === 'Todas as Áreas') return null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col pb-32">
      <PageHeader title="Nova Trilha" subtitle={`Temas de ${area}`} onBack={onBack} />
      
      <div className="pt-4 px-4">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            <motion.button
              onClick={() => { haptic.selection(); onSelect('Todos os Temas'); }}
              className="w-full flex items-center justify-between p-4 rounded-3xl border border-primary/40 bg-primary/5 shadow-sm hover:border-primary transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">Todos os Temas</p>
                  <p className="text-xs text-muted-foreground">Misturar tudo de {area}</p>
                </div>
              </div>
            </motion.button>

            {temas.map(tema => (
              <motion.button
                key={tema}
                onClick={() => { haptic.selection(); onSelect(tema); }}
                className="w-full flex items-center justify-between p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{tema}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- SETUP 3: RITMO/PRAZO ---
const SetupDetalhes = ({ onBack, onFinish }: { onBack: () => void, onFinish: (dias: number, cards: number) => void }) => {
  const [dias, setDias] = useState(7);
  const [cards, setCards] = useState(20);
  const opcoesDias = [3, 7, 15, 30];
  const opcoesCards = [10, 20, 30, 50];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col pt-4 px-4 pb-32">
      <button onClick={onBack} className="self-start p-2 mb-4 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Meta de Estudo</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Defina sua rotina de revisão
        </p>

        <p className="text-left text-sm font-bold text-foreground mt-8 mb-3">1. Quantos dias vai durar?</p>
        <div className="grid grid-cols-4 gap-2 mb-8">
          {opcoesDias.map(num => (
            <button
              key={num}
              onClick={() => { haptic.selection(); setDias(num); }}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                dias === num ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/50 bg-card/60 hover:border-primary/50'
              }`}
            >
              <span className={`text-xl font-black ${dias === num ? 'text-primary' : 'text-foreground'}`}>{num}</span>
              <span className={`text-[10px] uppercase font-bold ${dias === num ? 'text-primary' : 'text-muted-foreground'}`}>Dias</span>
            </button>
          ))}
        </div>

        <p className="text-left text-sm font-bold text-foreground mb-3">2. Cards por dia</p>
        <div className="grid grid-cols-4 gap-2 mb-8">
          {opcoesCards.map(num => (
            <button
              key={num}
              onClick={() => { haptic.selection(); setCards(num); }}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                cards === num ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/50 bg-card/60 hover:border-primary/50'
              }`}
            >
              <span className={`text-xl font-black ${cards === num ? 'text-primary' : 'text-foreground'}`}>{num}</span>
              <span className={`text-[10px] uppercase font-bold ${cards === num ? 'text-primary' : 'text-muted-foreground'}`}>Cards</span>
            </button>
          ))}
        </div>

        <button 
          onClick={() => { haptic.medium(); onFinish(dias, cards); }}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
        >
          Criar Trilha
          <Target className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

// --- MAPA DA TRILHA ---
const TrilhaMapaEstudo = ({ trilha, onBack }: { trilha: FlashcardTrilhaAtiva, onBack: () => void }) => {
  const { marcarDiaConcluido, desmarcarDiaConcluido } = useFlashcardsTrilhasStore();
  const navigate = useNavigate();

  const handlePraticarDia = (diaIndex: number) => {
    haptic.selection();
    // Montar os parâmetros para a rota de estudo
    const params = new URLSearchParams();
    if (trilha.area !== 'Todas as Áreas') params.set('area', trilha.area);
    else params.set('modo', 'todos');
    
    if (trilha.tema !== 'Todos os Temas') params.set('temas', trilha.tema);
    
    params.set('limite', trilha.cardsPorDia.toString());
    
    navigate(`/flashcards/estudar?${params.toString()}`);
  };

  const dias = Array.from({ length: trilha.diasMeta }, (_, i) => i + 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col bg-background min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <button onClick={onBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-card">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-foreground truncate">{trilha.area}</h1>
            <p className="text-xs text-muted-foreground truncate">{trilha.tema}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Progresso da Trilha</p>
            <p className="text-3xl font-black text-foreground mt-1">
              {trilha.diasConcluidos.length}<span className="text-muted-foreground text-xl">/{trilha.diasMeta}</span>
            </p>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${(trilha.diasConcluidos.length / trilha.diasMeta) * 100}, 100`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-xs">
              {Math.round((trilha.diasConcluidos.length / trilha.diasMeta) * 100)}%
            </div>
          </div>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
          {dias.map(dia => {
            const isCompleted = trilha.diasConcluidos.includes(dia);
            const isNext = !isCompleted && (!trilha.diasConcluidos.includes(dia - 1) && dia !== 1 ? false : true);
            // Só habilita se for o próximo ou já estiver completo
            const isAccessible = isCompleted || isNext || (dia === 1);

            return (
              <div key={dia} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-card shadow-sm z-10 md:mx-auto shrink-0 relative transition-colors">
                  {isCompleted ? (
                    <div className="w-full h-full bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : isAccessible ? (
                    <div className="w-full h-full bg-background border-2 border-primary text-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/10">
                      <span className="font-bold text-sm">{dia}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-muted/30 border-2 border-border/50 text-muted-foreground rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm opacity-50">{dia}</span>
                    </div>
                  )}
                </div>

                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-3xl bg-card border border-border/50 shadow-sm transition-all flex flex-col gap-3">
                  <div>
                    <h3 className={`font-bold text-base ${isAccessible ? 'text-foreground' : 'text-muted-foreground'}`}>Dia {dia}</h3>
                    <p className="text-xs text-muted-foreground">{trilha.cardsPorDia} cards</p>
                  </div>
                  
                  {isAccessible && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePraticarDia(dia)}
                        className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                          isCompleted ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-primary text-primary-foreground shadow-md shadow-primary/20 active:scale-95'
                        }`}
                      >
                        Estudar
                      </button>
                      <button
                        onClick={() => {
                          if (isCompleted) {
                            desmarcarDiaConcluido(trilha.id, dia);
                          } else {
                            marcarDiaConcluido(trilha.id, dia);
                            haptic.success();
                          }
                        }}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                          isCompleted ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                        }`}
                      >
                        {isCompleted ? <Trash2 className="w-4 h-4" /> : <CheckCircle2 className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function FlashcardsTrilhas() {
  const [step, setStep] = useState<'home' | 'area' | 'tema' | 'detalhes' | 'mapa'>('home');
  const [trilhaAtivaTemp, setTrilhaAtivaTemp] = useState<Partial<FlashcardTrilhaAtiva>>({});
  const [trilhaSelecionada, setTrilhaSelecionada] = useState<string | null>(null);
  const { trilhasAtivas, setTrilhaAtiva, limparTrilha } = useFlashcardsTrilhasStore();

  const trilhasArray = Object.values(trilhasAtivas).sort((a,b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());

  const handleFinishSetup = (dias: number, cards: number) => {
    const novaTrilha: FlashcardTrilhaAtiva = {
      id: Date.now().toString(),
      area: trilhaAtivaTemp.area!,
      tema: trilhaAtivaTemp.tema!,
      diasMeta: dias,
      cardsPorDia: cards,
      diasConcluidos: [],
      dataInicio: new Date().toISOString(),
    };
    setTrilhaAtiva(novaTrilha);
    setTrilhaSelecionada(novaTrilha.id);
    setStep('mapa');
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {step === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full flex flex-col pb-32">
            <PageHeader title="Trilhas de Estudo" subtitle="Rotas guiadas de Flashcards" />
            <div className="px-4 mt-6">
              <button 
                onClick={() => { haptic.selection(); setStep('area'); setTrilhaAtivaTemp({}); }}
                className="w-full bg-card hover:bg-card/80 border border-primary/30 p-4 rounded-3xl flex items-center justify-between transition-all active:scale-[0.98] shadow-sm mb-8"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <RouteIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-foreground">Criar Nova Trilha</p>
                    <p className="text-xs text-muted-foreground">Trace sua própria rota de estudos</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
              </button>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2">Suas Trilhas</h3>
                
                {trilhasArray.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <RouteIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Você ainda não criou nenhuma trilha.</p>
                  </div>
                ) : (
                  trilhasArray.map(trilha => (
                    <div key={trilha.id} className="relative w-full rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => { haptic.selection(); setTrilhaSelecionada(trilha.id); setStep('mapa'); }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1">TRILHA ATIVA</p>
                          <p className="text-base font-bold text-foreground">{trilha.area}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{trilha.tema}</p>
                        </div>
                        <button 
                          onClick={() => {
                            if (window.confirm("Deseja excluir esta trilha? O progresso será perdido.")) {
                              limparTrilha(trilha.id);
                            }
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div 
                        className="cursor-pointer"
                        onClick={() => { haptic.selection(); setTrilhaSelecionada(trilha.id); setStep('mapa'); }}
                      >
                        <p className="text-xs text-muted-foreground mb-2">
                          {trilha.cardsPorDia} cards/dia · {trilha.diasConcluidos.length} de {trilha.diasMeta} dias
                        </p>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500 rounded-full"
                            style={{ width: `${(trilha.diasConcluidos.length / trilha.diasMeta) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'area' && (
          <SetupArea 
            key="area"
            onCancel={() => setStep('home')} 
            onSelect={(area) => { setTrilhaAtivaTemp({ area }); setStep('tema'); }} 
          />
        )}
        
        {step === 'tema' && (
          <SetupTema 
            key="tema"
            area={trilhaAtivaTemp.area!}
            onBack={() => setStep('area')}
            onSelect={(tema) => { setTrilhaAtivaTemp(prev => ({ ...prev, tema })); setStep('detalhes'); }}
          />
        )}

        {step === 'detalhes' && (
          <SetupDetalhes 
            key="detalhes"
            onBack={() => setStep('tema')}
            onFinish={handleFinishSetup}
          />
        )}

        {step === 'mapa' && trilhaSelecionada && trilhasAtivas[trilhaSelecionada] && (
          <TrilhaMapaEstudo 
            key="mapa"
            trilha={trilhasAtivas[trilhaSelecionada]}
            onBack={() => setStep('home')}
          />
        )}
      </AnimatePresence>

      {(step === 'home' || step === 'mapa') && <FlashcardsBottomNav />}
    </div>
  );
}
