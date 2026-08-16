import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Scale, Loader2, Link2, Database, ChevronLeft, ChevronRight, Layers, Clock, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface WizardLeisSecasProps {
  selectedArea: string;
}

type WizardStep = 'list' | 'details' | 'extract' | 'refine' | 'generating';

export default function WizardLeisSecas({ selectedArea }: WizardLeisSecasProps) {
  const [leis, setLeis] = useState<any[]>([]);
  const [loadingLeis, setLoadingLeis] = useState(true);
  const [cardsCountMap, setCardsCountMap] = useState<Record<string, number>>({});
  
  const [step, setStep] = useState<WizardStep>('list');
  const [selectedLei, setSelectedLei] = useState<any>(null);
  
  // Extração
  const [planaltoUrl, setPlanaltoUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [estrutura, setEstrutura] = useState<any[]>([]);
  
  // Refinamento
  const [cardsPerArticle, setCardsPerArticle] = useState<number | 'auto'>(10);
  
  // Geração
  const [generatingBlock, setGeneratingBlock] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoadingLeis(true);
      try {
        // 1. Fetch leis
        const { data: leisData, error: leisError } = await supabase
          .from('vade_mecum_leis')
          .select('*')
          .eq('categoria', selectedArea)
          .order('ordem', { ascending: true });
        
        if (leisError) throw leisError;
        
        // 2. Fetch cards count grouped by tema (where area = selectedArea is not totally reliable, we must match tema prefixes)
        // We will fetch all temas for this area first
        const { data: temasData, error: temasError } = await supabase.rpc('flashcards_temas', { _area: selectedArea });
        
        if (isMounted) {
          setLeis(leisData || []);
          
          if (!temasError && temasData) {
            const counts: Record<string, number> = {};
            // Match tema names with law short names
            leisData?.forEach(lei => {
              const prefix = lei.nome_curto || lei.nome;
              let total = 0;
              temasData.forEach((t: any) => {
                if (t.tema.startsWith(prefix)) {
                  total += t.total;
                }
              });
              counts[lei.id] = total;
            });
            setCardsCountMap(counts);
          }
        }
      } catch (err: any) {
        toast.error('Erro ao buscar dados: ' + err.message);
      } finally {
        if (isMounted) setLoadingLeis(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [selectedArea]);

  const handleExtrairSupabase = async () => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
        body: { acao: 'listar_estrutura', lei_id: selectedLei.id }
      });
      if (error) throw error;
      setEstrutura(data?.estrutura || []);
      setStep('refine');
    } catch (err: any) {
      toast.error('Erro ao buscar estrutura: ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleExtrairPlanalto = async () => {
    if (!planaltoUrl || !planaltoUrl.includes('planalto.gov.br')) {
      return toast.error('URL inválida. Use um link do Planalto.');
    }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
        body: { acao: 'extrair_planalto', url: planaltoUrl }
      });
      if (error) throw error;
      setEstrutura(data?.estrutura || []);
      setStep('refine');
    } catch (err: any) {
      toast.error('Erro ao extrair do Planalto: ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleGerarBloco = async (bloco: any) => {
    setGeneratingBlock(bloco.titulo);
    setStep('generating');
    try {
      const temaNome = `${selectedLei.nome_curto || selectedLei.nome} - ${bloco.titulo}`;
      
      const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
        body: { 
          acao: 'gerar_flashcards',
          area: selectedArea, 
          tema: temaNome,
          artigos: bloco.artigos,
          quantidadePorArtigo: cardsPerArticle
        }
      });

      if (error) throw error;
      toast.success(`${data?.total || 0} flashcards gerados com sucesso!`);
      
      // Update local count mock
      setCardsCountMap(prev => ({
        ...prev,
        [selectedLei.id]: (prev[selectedLei.id] || 0) + (data?.total || 0)
      }));
      
      setStep('details');
    } catch (err: any) {
      toast.error('Erro na geração: ' + err.message);
      setStep('refine');
    } finally {
      setGeneratingBlock(null);
    }
  };

  const handleGerarTudo = async () => {
    if (!selectedLei) return;
    const todosArtigos = estrutura.reduce((acc: any[], bloco: any) => [...acc, ...(bloco.artigos || [])], []);
    if (todosArtigos.length === 0) return toast.error('Nenhum artigo mapeado.');
    
    setGeneratingBlock('Todos os Blocos (Completo)');
    setStep('generating');
    try {
      const temaNome = `${selectedLei.nome_curto || selectedLei.nome} - Completo`;
      
      const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
        body: { 
          acao: 'gerar_flashcards',
          area: selectedArea, 
          tema: temaNome,
          artigos: todosArtigos,
          quantidadePorArtigo: cardsPerArticle
        }
      });

      if (error) throw error;
      toast.success(`${data?.total || 0} flashcards gerados com sucesso!`);
      
      setCardsCountMap(prev => ({
        ...prev,
        [selectedLei.id]: (prev[selectedLei.id] || 0) + (data?.total || 0)
      }));
      
      setStep('details');
    } catch (err: any) {
      toast.error('Erro na geração: ' + err.message);
      setStep('refine');
    } finally {
      setGeneratingBlock(null);
    }
  };

  if (loadingLeis) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-6 mt-4">
      {/* HEADER DE CONTEXTO */}
      <div className="mb-8">
        {step !== 'list' && (
          <button 
            onClick={() => setStep(step === 'details' ? 'list' : step === 'extract' ? 'details' : step === 'refine' ? 'extract' : 'list')}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            {step === 'details' ? 'Voltar para Leis' : 'Voltar passo anterior'}
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold font-display uppercase">{selectedLei ? (selectedLei.nome_curto || selectedLei.nome) : selectedArea}</h2>
          <p className="text-muted-foreground">
            {step === 'list' ? 'Selecione uma lei para iniciar' : 
             step === 'details' ? 'Detalhes e Status da Lei' : 
             step === 'extract' ? 'Passo 1: Extração de Dados' :
             step === 'refine' ? 'Passo 2: Refinamento e Estimativas' : 'Gerando Flashcards...'}
          </p>
        </div>
      </div>

      {/* STEP: LISTAGEM DE LEIS */}
      {step === 'list' && (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden divide-y divide-border/50 shadow-sm">
          {leis.map(lei => {
            const count = cardsCountMap[lei.id] || 0;
            const isFeito = count > 0;
            const anoText = lei.ano ? ` (${lei.ano})` : '';
            
            // Lógica para evitar "CÓDIGO CIVIL - CÓDIGO CIVIL"
            const nomeCurto = lei.nome_curto || lei.nome;
            const tituloFinal = lei.nome && lei.nome !== nomeCurto 
              ? `${lei.nome} - ${nomeCurto}`
              : nomeCurto;
            
            return (
              <button 
                key={lei.id} 
                onClick={() => { setSelectedLei(lei); setStep('details'); }}
                className="w-full p-5 hover:bg-muted/30 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-4 pr-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isFeito ? 'bg-green-500/10' : 'bg-muted group-hover:bg-amber-500/10'}`}>
                    {isFeito ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Scale className="w-6 h-6 text-muted-foreground group-hover:text-amber-500 transition-colors" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-amber-500 transition-colors text-base leading-tight">
                      {tituloFinal}{anoText}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-sm text-muted-foreground">
                        {lei.total_artigos_mapeados || lei.total_artigos || 0} artigos mapeados
                      </p>
                      <span className="text-muted-foreground/30">•</span>
                      {isFeito ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-500/10 text-green-500">
                          {count} flashcards
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EF4444]/15 text-[#EF4444]">
                          0 flashcards
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* STEP: DETALHES DA LEI */}
      {step === 'details' && selectedLei && (
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">{selectedLei.nome_curto || selectedLei.nome}</h3>
              <p className="text-muted-foreground mt-1">{selectedLei.nome}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display text-amber-500">{cardsCountMap[selectedLei.id] || 0}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Cards Totais</div>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-xl p-6 flex flex-col items-center justify-center text-center border border-dashed border-border mb-6">
            <Scale className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-lg mb-2">Geração de Flashcards</h4>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Inicie o wizard de extração e refinamento para mapear os títulos, capítulos e artigos desta lei e gerar os cards com inteligência artificial.
            </p>
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setStep('extract')}>
              Iniciar Wizard de Geração <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP: EXTRAÇÃO */}
      {step === 'extract' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-6 flex flex-col">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Usar Banco de Dados</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              Extrai a estrutura diretamente das tabelas internas do Vade Mecum. É mais rápido e seguro se a lei já estiver devidamente importada no sistema.
            </p>
            <Button 
              disabled={extracting} 
              onClick={handleExtrairSupabase}
              className="w-full"
            >
              {extracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Extrair do Supabase
            </Button>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6 flex flex-col">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Link2 className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Extração Web (Planalto)</h3>
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              Cola o link do Planalto. A IA vai acessar, limpar e organizar a árvore de artigos ao vivo.
            </p>
            <div className="space-y-3 mt-auto">
              <Input 
                placeholder="https://www.planalto.gov.br/..." 
                value={planaltoUrl}
                onChange={e => setPlanaltoUrl(e.target.value)}
              />
              <Button 
                variant="outline"
                disabled={extracting} 
                onClick={handleExtrairPlanalto}
                className="w-full"
              >
                {extracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Extrair da Web
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP: REFINAMENTO */}
      {step === 'refine' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center bg-card border border-border/50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">Estrutura Mapeada</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estimativa: <strong className="text-[#EF4444]">{cardsPerArticle === 'auto' ? `~${estrutura.reduce((s, b) => s + (b.artigos?.length || 0), 0) * 15}` : `~${estrutura.reduce((s, b) => s + (b.artigos?.length || 0), 0) * (cardsPerArticle as number)}`} cards no total</strong>
                </p>
              </div>
            </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-muted/50 rounded-md p-1 pr-2 border border-border/50">
                  <span className="text-xs font-medium pl-2 text-muted-foreground">Densidade:</span>
                  <select 
                    value={cardsPerArticle} 
                    onChange={e => setCardsPerArticle(e.target.value === 'auto' ? 'auto' : parseInt(e.target.value))}
                    className="h-8 text-xs bg-background text-foreground font-bold rounded px-2 outline-none border border-border/50"
                  >
                    <option value={10}>Padrão (10 cards/art)</option>
                    <option value={25}>Profunda (25 cards/art)</option>
                    <option value="auto">Inteligente (Mín. 10/art)</option>
                  </select>
                </div>
                <Button 
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white h-10 px-5 text-sm font-bold shadow-md shadow-red-900/20 transition-all"
                  onClick={() => handleGerarTudo()}
                  disabled={step === 'generating'}
                >
                  Gerar Todos (Completa)
                </Button>
              </div>
            </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {estrutura.map((bloco, idx) => {
              const arts = bloco.artigos?.length || 0;
              const estCards = cardsPerArticle === 'auto' ? 'Auto' : arts * (cardsPerArticle as number);
              return (
                <div key={idx} className="bg-card border border-border/50 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium text-sm mb-3 line-clamp-2" title={bloco.titulo}>{bloco.titulo}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-foreground/80">{arts}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">Artigos</div>
                      </div>
                      <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-[#EF4444]">~{estCards}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-[#EF4444]/80 mt-1">Est. de Cards</div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold tracking-wide shadow-md shadow-red-900/20"
                    onClick={() => handleGerarBloco(bloco)}
                  >
                    Gerar para este Bloco
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP: GERANDO */}
      {step === 'generating' && (
        <div className="bg-card border border-border/50 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-amber-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500/50" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Processando com Inteligência Artificial...</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Analisando texto literal, criando lacunas assertivas e estruturando perguntas doutrinárias para o bloco <strong className="text-foreground">{generatingBlock}</strong>.
            </p>
          </div>
          <div className="w-full max-w-md pt-4">
            <Progress value={undefined} className="h-2" />
            <p className="text-xs text-muted-foreground mt-3 font-medium flex items-center justify-center gap-2">
              <Clock className="w-3 h-3" /> Tempo estimado: 1 a 3 minutos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
