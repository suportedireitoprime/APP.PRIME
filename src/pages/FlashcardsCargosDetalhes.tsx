import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { Building, ArrowLeft, Target, Calendar, CheckCircle2, ChevronLeft, Trash2, Layers } from 'lucide-react';
import { useFlashcardsTrilhasStore, type FlashcardTrilhaAtiva } from '@/lib/flashcardsTrilhasStore';

type DisciplinaEdital = {
  area: string;
  peso: string;
  descricao: string;
};

type Cargo = {
  id: string;
  cargo: string;
  orgao: string;
  banca: string | null;
  descricao_geral: string | null;
  edital_disciplinas: DisciplinaEdital[];
};

// --- COMPONENTES AUXILIARES ---

const SetupRitmo = ({ cargo, onBack, onFinish }: { cargo: Cargo, onBack: () => void, onFinish: (dias: number, cards: number) => void }) => {
  const [dias, setDias] = useState(60);
  const [cardsPorDia, setCardsPorDia] = useState(30);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col pb-32">
      <PageHeader title="Ritmo de Estudo" subtitle="Configure sua Trilha" onBack={onBack} />
      
      <div className="px-4 mt-6 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">Defina sua Meta</h2>
          <p className="text-sm text-muted-foreground">Em quantos dias você quer fechar o edital de {cargo.orgao}?</p>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
          <label className="text-sm font-bold text-foreground mb-4 block flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Dias para fechar o edital
          </label>
          <div className="flex items-center gap-4 mb-2">
            <input 
              type="range" 
              min="15" 
              max="180" 
              step="15"
              value={dias}
              onChange={(e) => setDias(parseInt(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-xl font-black text-primary w-12 text-right">{dias}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Intenso (15d)</span>
            <span>Tranquilo (180d)</span>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
          <label className="text-sm font-bold text-foreground mb-4 block flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Cards por dia
          </label>
          <div className="flex items-center gap-4 mb-2">
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="5"
              value={cardsPorDia}
              onChange={(e) => setCardsPorDia(parseInt(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-xl font-black text-primary w-12 text-right">{cardsPorDia}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Leve (10)</span>
            <span>Hardcore (100)</span>
          </div>
        </div>

        <button 
          onClick={() => { haptic.medium(); onFinish(dias, cardsPorDia); }}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-14 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
        >
          Criar Trilha do Edital
        </button>
      </div>
    </motion.div>
  );
};

const TrilhaMapaEdital = ({ cargo, trilha, onBack }: { cargo: Cargo, trilha: FlashcardTrilhaAtiva, onBack: () => void }) => {
  const { limparTrilha } = useFlashcardsTrilhasStore();
  const navigate = useNavigate();

  const handlePraticarDia = (diaIndex: number) => {
    haptic.selection();
    const params = new URLSearchParams();
    params.set('modo', 'edital');
    params.set('editalId', cargo.id);
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
            <h1 className="text-lg font-black text-foreground truncate">{cargo.cargo}</h1>
            <p className="text-xs text-muted-foreground truncate">{cargo.orgao}</p>
          </div>
          <button 
            onClick={() => {
              haptic.medium();
              limparTrilha(trilha.id);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shrink-0"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-6 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Progresso do Edital</p>
            <p className="text-3xl font-black text-foreground mt-1">
              {trilha.diasConcluidos.length}<span className="text-muted-foreground text-xl">/{trilha.diasMeta}</span>
            </p>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${(trilha.diasConcluidos.length / Math.max(1, trilha.diasMeta)) * 100}, 100`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-xs">
              {Math.round((trilha.diasConcluidos.length / Math.max(1, trilha.diasMeta)) * 100)}%
            </div>
          </div>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
          {dias.map(dia => {
            const isCompleted = trilha.diasConcluidos.includes(dia);
            const isNext = !isCompleted && (!trilha.diasConcluidos.includes(dia - 1) && dia !== 1 ? false : true);
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
                    <p className="text-xs text-muted-foreground mt-0.5">Mix do Edital • {trilha.cardsPorDia} cards</p>
                  </div>
                  
                  <button 
                    disabled={!isAccessible}
                    onClick={() => handlePraticarDia(dia)}
                    className={`h-10 rounded-xl font-bold text-sm w-full transition-all flex items-center justify-center ${
                      isCompleted ? 'bg-primary/10 text-primary' :
                      isAccessible ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] shadow-md shadow-primary/20' : 
                      'bg-muted text-muted-foreground/50'
                    }`}
                  >
                    {isCompleted ? 'Revisar Novamente' : isAccessible ? 'Estudar Agora' : 'Bloqueado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};


// --- PÁGINA PRINCIPAL ---

type ViewStep = 'detalhes' | 'setup_ritmo' | 'mapa';

export default function FlashcardsCargosDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [step, setStep] = useState<ViewStep>('detalhes');
  const { trilhasAtivas, setTrilhaAtiva } = useFlashcardsTrilhasStore();
  
  const trilhaDoEditalId = Object.keys(trilhasAtivas).find(k => trilhasAtivas[k].isEdital && trilhasAtivas[k].editalId === id);
  const trilhaAtiva = trilhaDoEditalId ? trilhasAtivas[trilhaDoEditalId] : null;

  useEffect(() => {
    if (trilhaAtiva && step === 'detalhes' && !loading) {
      setStep('mapa');
    }
  }, [trilhaAtiva, step, loading]);

  useEffect(() => {
    async function loadCargo() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('flashcards_cargos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setCargo(data as Cargo);
      } catch (err) {
        console.error('Erro ao carregar cargo:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCargo();
  }, [id]);

  const handleCriarTrilha = (dias: number, cardsPorDia: number) => {
    if (!cargo) return;
    const novaTrilha: FlashcardTrilhaAtiva = {
      id: crypto.randomUUID(),
      nome: cargo.cargo,
      area: 'Edital Completo',
      tema: 'Todos os Temas',
      diasMeta: dias,
      cardsPorDia: cardsPorDia,
      diasConcluidos: [],
      dataInicio: new Date().toISOString(),
      isEdital: true,
      editalId: cargo.id
    };
    setTrilhaAtiva(novaTrilha);
    setStep('mapa');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-[120px] md:pb-8 flex flex-col font-sans">
        <PageHeader title="Detalhes do Edital" onBack={() => navigate('/flashcards/cargos')} />
        <div className="p-4 space-y-4 pt-10">
          <div className="h-32 bg-card/50 animate-pulse rounded-3xl" />
          <div className="h-24 bg-card/50 animate-pulse rounded-3xl" />
          <div className="h-40 bg-card/50 animate-pulse rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-[120px] md:pb-8 flex flex-col font-sans">
        <PageHeader title="Cargo não encontrado" onBack={() => navigate('/flashcards/cargos')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-[120px] md:pb-8 flex flex-col font-sans">
      <AnimatePresence mode="wait">
        {step === 'detalhes' && !trilhaAtiva && (
          <motion.div key="detalhes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-4">
              <button 
                onClick={() => { haptic.selection(); navigate('/flashcards/cargos'); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-sm active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-2 pb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                <Building className="w-4 h-4" />
                {cargo.orgao}
                {cargo.banca && <> • {cargo.banca}</>}
              </div>
              
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
                {cargo.cargo}
              </h1>
              
              {cargo.descricao_geral && (
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  {cargo.descricao_geral}
                </p>
              )}
            </div>

            <div className="mb-8">
              <button 
                onClick={() => { haptic.selection(); setStep('setup_ritmo'); }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-16 rounded-3xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Target className="w-6 h-6" />
                Iniciar Trilha do Edital
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Conteúdo Programático
                </h3>
                <span className="text-xs font-bold bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  {cargo.edital_disciplinas?.length || 0} Matérias
                </span>
              </div>
              
              <div className="space-y-3">
                {cargo.edital_disciplinas?.map((disc, index) => (
                  <div key={index} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-foreground">{disc.area}</h4>
                      {disc.peso && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          disc.peso.toLowerCase() === 'alta' ? 'bg-red-500/10 text-red-500' :
                          disc.peso.toLowerCase() === 'média' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' :
                          'bg-primary/10 text-primary'
                        }`}>
                          Peso {disc.peso}
                        </span>
                      )}
                    </div>
                    {disc.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {disc.descricao}
                      </p>
                    )}
                  </div>
                ))}
                
                {(!cargo.edital_disciplinas || cargo.edital_disciplinas.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground bg-card rounded-3xl border border-border/50">
                    Nenhuma disciplina cadastrada para este edital.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'setup_ritmo' && cargo && (
          <SetupRitmo 
            cargo={cargo} 
            onBack={() => setStep('detalhes')} 
            onFinish={handleCriarTrilha} 
          />
        )}

        {step === 'mapa' && trilhaAtiva && cargo && (
          <TrilhaMapaEdital 
            cargo={cargo}
            trilha={trilhaAtiva}
            onBack={() => navigate('/flashcards/cargos')}
          />
        )}
      </AnimatePresence>

      {(step === 'detalhes' || step === 'mapa') && <FlashcardsBottomNav />}
    </div>
  );
}
