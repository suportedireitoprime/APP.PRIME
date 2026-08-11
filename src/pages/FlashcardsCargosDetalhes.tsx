import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsCargoBottomNav, { CargoTab } from '@/components/flashcards/FlashcardsCargoBottomNav';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { Building, ArrowLeft, Target, Calendar, CheckCircle2, ChevronLeft, Trash2, Layers, Play, Clock, Award, FileText } from 'lucide-react';
import { useFlashcardsTrilhasStore, type FlashcardTrilhaAtiva } from '@/lib/flashcardsTrilhasStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';

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
          <p className="text-sm text-muted-foreground">Em quantos dias vocÃƒÂª quer fechar o edital de {cargo.orgao}?</p>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col bg-background min-h-screen pb-32">
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

      <div className="px-4 pt-6">
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
                    <p className="text-xs text-muted-foreground mt-0.5">Mix do Edital Ã¢â‚¬Â¢ {trilha.cardsPorDia} cards</p>
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


// --- PÃƒÂGINA PRINCIPAL ---

export default function FlashcardsCargosDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<CargoTab>('livre');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { trilhasAtivas, setTrilhaAtiva } = useFlashcardsTrilhasStore();
  
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);
  const [temasArea, setTemasArea] = useState<{tema: string, total: number}[]>([]);

  const trilhaDoEditalId = Object.keys(trilhasAtivas).find(k => trilhasAtivas[k].isEdital && trilhasAtivas[k].editalId === id);
  const trilhaAtiva = trilhaDoEditalId ? trilhasAtivas[trilhaDoEditalId] : null;

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
  };

  const handleAreaClick = async (area: string) => {
    haptic.selection();
    setAreaSelecionada(area);
    setTemasArea([]); // limpa temas anteriores
    setSheetOpen(true);
    try {
      const { data } = await supabase.rpc('flashcards_temas', { _area: area });
      if (data) {
        setTemasArea((data as any[]).map(t => ({ tema: t.tema, total: Number(t.total) })));
      }
    } catch (err) {
      console.error('Erro ao buscar temas:', err);
    }
  };

  const handlePraticarLivre = (tema?: string) => {
    haptic.selection();
    setSheetOpen(false); // Fecha o menu
    const params = new URLSearchParams();
    if (!tema) {
      // Praticar todas as matÃ©rias da Ãrea selecionada
      params.set('area', areaSelecionada!);
      params.set('modo', 'todos');
    } else {
      // Praticar um tema especÃ­fico
      params.set('area', areaSelecionada!);
      params.set('tema', tema);
      params.set('modo', 'todos');
    }
    params.set('limite', '20');
    navigate(`/flashcards/estudar?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-[120px] md:pb-8 flex flex-col font-sans">
        <PageHeader title="Carregando Edital" onBack={() => navigate('/flashcards/cargos')} />
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
        <PageHeader title="Cargo nÃƒÂ£o encontrado" onBack={() => navigate('/flashcards/cargos')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <AnimatePresence mode="wait">
        
        {/* TAB: LIVRE (PrÃ¡tica Livre) */}
        {activeTab === 'livre' && (
          <motion.div key="livre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pb-32 flex flex-col relative">
            <div className="flex items-center gap-3 py-4">
              <button 
                onClick={() => { haptic.selection(); navigate('/flashcards/cargos'); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-card border border-border shadow-sm active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-display text-xl font-black">Prática Livre</h2>
            </div>
            
            <p className="text-muted-foreground text-sm mb-6 px-1">
              Escolha uma área do edital de <strong>{cargo.orgao}</strong> para praticar flashcards livremente.
            </p>

            <div className="space-y-3 pb-8">
              {cargo.edital_disciplinas?.map((disc, index) => {
                const { icon: Icon, color } = getAreaVisual(disc.area);
                return (
                  <button
                    key={index}
                    onClick={() => handleAreaClick(disc.area)}
                    className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.99] gap-3 w-full"
                  >
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110" strokeWidth={1.8} style={{ color }} />
                        <div className="min-w-0">
                          <p className="truncate text-base font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight">
                            {disc.area}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium">
                            Toque para ver os tópicos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {(!cargo.edital_disciplinas || cargo.edital_disciplinas.length === 0) && (
                <div className="text-center py-8 text-muted-foreground bg-card rounded-3xl border border-border/50">
                  Nenhuma disciplina cadastrada para este edital.
                </div>
              )}
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetContent side="bottom" className="rounded-t-3xl border-t-0 p-0 h-[85vh] bg-background flex flex-col focus-visible:outline-none">
                <div className="p-6 pb-4 border-b border-border/50 shrink-0 relative">
                  <SheetHeader>
                    <SheetTitle className="text-xl font-black text-left">{areaSelecionada}</SheetTitle>
                    <p className="text-sm text-muted-foreground text-left mt-1">O que você quer praticar?</p>
                  </SheetHeader>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-safe-offset-12">
                  <button
                    onClick={() => handlePraticarLivre()}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm h-12 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                  >
                    <Layers className="w-5 h-5 fill-current" />
                    Praticar Todas as Matérias
                  </button>
                  
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px bg-border/50 flex-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ou escolha uma matéria</span>
                    <div className="h-px bg-border/50 flex-1" />
                  </div>

                  <div className="space-y-2.5 pb-8">
                    {temasArea.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Carregando matérias...
                      </div>
                    ) : (
                      temasArea.map((t, index) => (
                        <button
                          key={index}
                          onClick={() => handlePraticarLivre(t.tema)}
                          className="group flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3 text-left transition-all hover:border-primary/50 hover:shadow-sm active:scale-[0.99] gap-2 w-full"
                        >
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold text-foreground group-hover:text-primary transition-colors tracking-tight">
                                  {t.tema}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-medium">
                                  {t.total} cards
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>
        )}

        {/* TAB: EDITAL (InformaÃƒÂ§ÃƒÂµes, Raio-X e Disciplinas) */}
        {activeTab === 'edital' && (
          <motion.div key="edital" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pb-32">
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
                <FileText className="w-4 h-4" />
                Raio-X do Edital
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

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  ConteÃƒÂºdo ProgramÃƒÂ¡tico
                </h3>
                <span className="text-xs font-bold bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  {cargo.edital_disciplinas?.length || 0} MatÃƒÂ©rias
                </span>
              </div>
              
              <div className="space-y-3">
                {cargo.edital_disciplinas?.map((disc, index) => (
                  <div key={index} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex flex-col gap-1.5 hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-foreground">{disc.area}</h4>
                      {disc.peso && (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          disc.peso.toLowerCase() === 'alta' ? 'bg-red-500/10 text-red-500' :
                          disc.peso.toLowerCase() === 'mÃƒÂ©dia' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500' :
                          'bg-primary/10 text-primary'
                        }`}>
                          Peso {disc.peso}
                        </span>
                      )}
                    </div>
                    {disc.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
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

        {/* TAB: TRILHAS */}
        {activeTab === 'trilhas' && !trilhaAtiva && (
          <SetupRitmo 
            cargo={cargo} 
            onBack={() => setActiveTab('livre')} 
            onFinish={handleCriarTrilha} 
          />
        )}

        {activeTab === 'trilhas' && trilhaAtiva && (
          <TrilhaMapaEdital 
            cargo={cargo}
            trilha={trilhaAtiva}
            onBack={() => setActiveTab('livre')}
          />
        )}
        
        {/* TAB: REVISÃƒÆ’O (Placeholder) */}
        {activeTab === 'revisao' && (
          <motion.div key="revisao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-24 pb-32">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-3">SessÃƒÂ£o de RevisÃƒÂ£o</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Revise os flashcards de {cargo.orgao} que estÃƒÂ£o agendados para hoje atravÃƒÂ©s da repetiÃƒÂ§ÃƒÂ£o espaÃƒÂ§ada.
            </p>
            <button className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Iniciar RevisÃƒÂ£o
            </button>
          </motion.div>
        )}

        {/* TAB: DESEMPENHO (Placeholder) */}
        {activeTab === 'desempenho' && (
          <motion.div key="desempenho" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-24 pb-32">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Award className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-3">Seu Desempenho</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Acompanhe sua taxa de acertos e evoluÃƒÂ§ÃƒÂ£o no edital {cargo.orgao}. Em breve!
            </p>
            <button 
              onClick={() => setActiveTab('livre')}
              className="h-12 px-6 rounded-xl bg-card border border-border font-bold hover:bg-accent active:scale-95 transition-all"
            >
              Voltar ao Edital
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      <FlashcardsCargoBottomNav 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
      />
    </div>
  );
}
