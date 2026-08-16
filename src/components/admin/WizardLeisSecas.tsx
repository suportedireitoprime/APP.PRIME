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
  const [blockCounts, setBlockCounts] = useState<Record<string, number>>({});
  const [blockLastUpdate, setBlockLastUpdate] = useState<Record<string, string>>({});
  
  // Refinamento
  const [cardsPerArticle, setCardsPerArticle] = useState<number | 'auto'>('auto');
  
  // Geração
  const [generatingBlock, setGeneratingBlock] = useState<string | null>(null);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoadingLeis(true);
      try {
        const { data: leisData, error: leisError } = await supabase
          .from('vade_mecum_leis')
          .select('*')
          .eq('categoria', selectedArea)
          .order('ordem', { ascending: true });
        
        if (leisError) throw leisError;
        
        const { data: temasData, error: temasError } = await supabase.rpc('flashcards_temas', { _area: selectedArea });
        
        if (isMounted) {
          setLeis(leisData || []);
          
          if (!temasError && temasData) {
            const counts: Record<string, number> = {};
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

  const fetchBlockDetails = async (estrut: any[], lei: any) => {
    try {
      const { data } = await supabase.rpc('flashcards_temas', { _area: selectedArea });
      if (data) {
        const counts: Record<string, number> = {};
        const prefix = lei.nome_curto || lei.nome;
        estrut.forEach(b => {
          const temaNome = `${prefix} - ${b.titulo}`;
          const found = data.find((t: any) => t.tema === temaNome);
          counts[b.titulo] = found ? found.total : 0;
        });
        setBlockCounts(counts);
      }

      // Fetch last generated date for the blocks
      const prefix = lei.nome_curto || lei.nome;
      const { data: recentCards } = await supabase
        .from('flashcards_cards')
        .select('tema, created_at')
        .ilike('tema', `${prefix}%`)
        .order('created_at', { ascending: false });

      if (recentCards) {
        const dates: Record<string, string> = {};
        estrut.forEach(b => {
          const temaNome = `${prefix} - ${b.titulo}`;
          const card = recentCards.find((c: any) => c.tema === temaNome);
          if (card) {
            dates[b.titulo] = new Date(card.created_at).toLocaleString('pt-BR');
          }
        });
        setBlockLastUpdate(dates);
      }

    } catch (e) {}
  };

  const handleExtrairSupabase = async () => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
        body: { acao: 'listar_estrutura', lei_id: selectedLei.id }
      });
      if (error) throw error;
      const result = data?.estrutura || [];
      setEstrutura(result);
      await fetchBlockDetails(result, selectedLei);
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
      const result = data?.estrutura || [];
      setEstrutura(result);
      await fetchBlockDetails(result, selectedLei);
      setStep('refine');
    } catch (err: any) {
      toast.error('Erro ao extrair do Planalto: ' + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleGerarBloco = async (bloco: any) => {
    setGeneratingBlock(bloco.titulo);
    setGenerationLogs(["Iniciando conexão segura com a IA..."]);
    setGenerationProgress(5);
    setStep('generating');
    
    // Simulate real-time logs
    const logInterval = setInterval(() => {
      setGenerationLogs(prev => {
        const msgs = [
          "Lendo desmembramentos dos artigos...",
          "Mapeando incisos, parágrafos e alíneas...",
          "Estruturando perguntas doutrinárias...",
          "Criando sentenças com lacunas assertivas...",
          "Validando tamanho dos tokens..."
        ];
        if (prev.length < msgs.length + 1) {
          setGenerationProgress(prev.length * 15);
          return [...prev, msgs[prev.length - 1]];
        }
        return prev;
      });
    }, 3000);

    try {
      const temaNome = `${selectedLei.nome_curto || selectedLei.nome} - ${bloco.titulo}`;
      
      const chunkArray = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
      const chunks = chunkArray(bloco.artigos || [], 4); // 4 artigos por chamada para evitar Timeout
      let totalBlock = 0;

      for (let i = 0; i < chunks.length; i++) {
        setGenerationLogs(prev => [...prev, `Processando lote ${i + 1}/${chunks.length} do bloco...`]);
        const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
          body: { 
            acao: 'gerar_flashcards',
            area: selectedArea, 
            tema: temaNome,
            artigos: chunks[i],
            quantidadePorArtigo: cardsPerArticle
          }
        });
        if (error) throw error;
        totalBlock += (data?.total || 0);
      }

      clearInterval(logInterval);
      setGenerationProgress(100);
      setGenerationLogs(prev => [...prev, "Sucesso! Cards injetados no banco de dados."]);

      toast.success(`${totalBlock} flashcards gerados com sucesso!`);
      
      // Update local count mock
      setCardsCountMap(prev => ({
        ...prev,
        [selectedLei.id]: (prev[selectedLei.id] || 0) + totalBlock
      }));

      // Refresh structure details
      await fetchBlockDetails(estrutura, selectedLei);
      
      setTimeout(() => setStep('refine'), 1500);
    } catch (err: any) {
      clearInterval(logInterval);
      toast.error('Erro na geração: ' + err.message);
      setStep('refine');
    } finally {
      setGeneratingBlock(null);
    }
  };

  const handleGerarTudo = async () => {
    if (!selectedLei) return;
    if (estrutura.length === 0) return toast.error('Nenhum artigo mapeado.');
    
    setStep('generating');
    let totalGerado = 0;
    
    try {
      const chunkArray = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

      // Processa cada bloco sequencialmente para evitar timeout na Edge Function
      for (const bloco of estrutura) {
        if (!bloco.artigos || bloco.artigos.length === 0) continue;
        
        setGeneratingBlock(`Processando: ${bloco.titulo}`);
        const temaNome = `${selectedLei.nome_curto || selectedLei.nome} - ${bloco.titulo}`;
        
        const chunks = chunkArray(bloco.artigos, 4);
        let blockTotal = 0;

        for (const chunk of chunks) {
          const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
            body: { 
              acao: 'gerar_flashcards',
              area: selectedArea, 
              tema: temaNome,
              artigos: chunk,
              quantidadePorArtigo: cardsPerArticle
            }
          });

          if (error) throw error;
          blockTotal += (data?.total || 0);
        }
        
        totalGerado += blockTotal;
        
        // Atualiza a contagem parcial no estado para o usuário ver progresso (opcional, mas bom pra UX)
        setCardsCountMap(prev => ({
          ...prev,
          [selectedLei.id]: (prev[selectedLei.id] || 0) + blockTotal
        }));
      }

      toast.success(`${totalGerado} flashcards gerados com sucesso para todos os blocos!`);
      setStep('details');
    } catch (err: any) {
      toast.error(`Erro na geração (parou após gerar ${totalGerado}): ` + err.message);
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
            <Button 
              size="lg" 
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-md shadow-red-900/20" 
              onClick={handleExtrairSupabase}
              disabled={extracting}
            >
              {extracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Extrair Estrutura do Supabase <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <button 
              onClick={() => setStep('extract')} 
              className="text-xs text-muted-foreground mt-4 hover:text-foreground transition-colors underline underline-offset-4"
              disabled={extracting}
            >
              Forçar extração externa via link do Planalto
            </button>
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
                  Estimativa: <strong className="text-[#EF4444]">{cardsPerArticle === 'auto' ? `~${estrutura.reduce((s, b) => s + (b.artigos?.length || 0), 0) * 15}` : `~${estrutura.reduce((s, b) => s + (b.artigos?.length || 0), 0) * (cardsPerArticle as number)}`} cards no total</strong> / <strong className="text-green-500">{cardsCountMap[selectedLei.id] || 0} já gerados</strong>
                </p>
              </div>
            </div>
              
              <div className="flex items-center gap-3 flex-wrap max-w-full">
                <div className="flex items-center gap-2 bg-muted/50 rounded-md p-1 pr-2 border border-border/50 max-w-full">
                  <span className="text-xs font-medium pl-2 text-muted-foreground shrink-0">Regra:</span>
                  <select 
                    value={cardsPerArticle} 
                    onChange={e => setCardsPerArticle(e.target.value === 'auto' ? 'auto' : parseInt(e.target.value))}
                    className="h-8 text-xs bg-background text-foreground font-bold rounded px-2 outline-none border border-border/50 max-w-[200px] md:max-w-xs lg:max-w-sm text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    <option value="auto">Opção 2 - Aprofundamento Máximo (10 Cards por desmembramento)</option>
                  </select>
                </div>
                <Button 
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white h-10 px-5 text-sm font-bold shadow-md shadow-red-900/20 transition-all"
                  onClick={() => handleGerarTudo()}
                  disabled={step === 'generating'}
                >
                  Gerar Todos (Restantes)
                </Button>
              </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {estrutura.map((bloco, idx) => {
              const arts = bloco.artigos?.length || 0;
              const generatedCount = blockCounts[bloco.titulo] || 0;
              const lastUpdated = blockLastUpdate[bloco.titulo];
              const isGenerated = generatedCount > 0;
              
              // Adiciona setinha entre TÍTULO/CAPÍTULO e a descrição (Ex: TÍTULO I › DA APLICAÇÃO)
              const formattedTitulo = bloco.titulo.replace(/^((?:TÍTULO|CAPÍTULO|LIVRO|PARTE|SEÇÃO|SUBSEÇÃO)\s+[IVXLCDM]+)\s+(.*)/i, '$1 › $2');

              return (
                <div key={idx} className={`border rounded-xl p-5 flex flex-col justify-between transition-colors ${isGenerated ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-card border-border/50'}`}>
                  <div>
                    <h4 className="font-medium text-sm mb-3 line-clamp-2" title={formattedTitulo}>{formattedTitulo}</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-foreground/80">{arts}</div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">Artigos</div>
                      </div>
                      <div className={`${isGenerated ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/20'} border rounded-lg p-3 text-center`}>
                        <div className={`text-xl font-bold ${isGenerated ? 'text-emerald-400' : 'text-amber-500'}`}>{isGenerated ? generatedCount : '~' + (arts * 15)}</div>
                        <div className={`text-[10px] uppercase font-bold tracking-wider ${isGenerated ? 'text-emerald-400/90' : 'text-amber-500/80'} mt-1`}>{isGenerated ? 'Gerados' : 'Est. de Cards'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {isGenerated ? (
                    <div className="w-full bg-emerald-500/20 text-emerald-400 font-bold text-sm rounded-md p-3 flex items-center justify-between border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Gerado com Sucesso
                      </div>
                      {lastUpdated && <span className="opacity-90 font-mono text-xs">{lastUpdated}</span>}
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold tracking-wide shadow-md shadow-red-900/20"
                      onClick={() => handleGerarBloco(bloco)}
                    >
                      Gerar para este Bloco
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP: GERANDO */}
      {step === 'generating' && (
        <div className="bg-card border border-border/50 rounded-xl p-8 flex flex-col items-center justify-center space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <Loader2 className="w-16 h-16 animate-spin text-amber-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500/50" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Processando com Inteligência Artificial...</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Analisando desmembramentos, criando lacunas assertivas e estruturando perguntas para: <strong className="text-foreground">{generatingBlock}</strong>.
            </p>
          </div>

          <div className="w-full max-w-2xl bg-black rounded-lg border border-border/50 overflow-hidden font-mono text-xs shadow-inner">
            <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-zinc-500 ml-2">Terminal de Geração</span>
            </div>
            <div className="p-4 space-y-2 h-[180px] overflow-y-auto flex flex-col justify-end">
              {generationLogs.map((log, i) => (
                <div key={i} className="flex gap-2 text-zinc-300 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-amber-500 shrink-0">[{new Date().toLocaleTimeString('pt-BR')}]</span>
                  <span>{log}</span>
                </div>
              ))}
              {generationProgress < 100 && (
                <div className="flex gap-2 text-zinc-500 mt-2">
                  <span className="shrink-0">[{new Date().toLocaleTimeString('pt-BR')}]</span>
                  <span className="flex items-center gap-1">Aguardando IA <span className="animate-pulse">...</span></span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-2xl pt-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-muted-foreground">Progresso</span>
              <span className="text-sm font-bold text-amber-500">{generationProgress}%</span>
            </div>
            <Progress value={generationProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-4 font-medium flex items-center justify-center gap-2">
              <Clock className="w-3 h-3" /> Tempo estimado: 30s a 2 minutos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
