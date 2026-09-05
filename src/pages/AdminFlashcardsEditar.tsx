import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Layers, Plus, Sparkles, Loader2, Trash2, BookOpen, Scale, Landmark, BookA, Users, Clock, AlertTriangle, ListTree, ChevronRight, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WizardLeisSecas from '@/components/admin/WizardLeisSecas';

type TemaRow = {
  tema: string;
  total: number;
  estudados?: number;
  compreendidos?: number;
  a_revisar?: number;
  area?: string;
};

type Step = 'categoria' | 'area' | 'temas';

const CATEGORIAS = [
  { id: 'materias', label: 'Matérias', icon: BookOpen, desc: 'Flashcards gerais por disciplina' },
  { id: 'leis', label: 'Leis Secas', icon: Scale, desc: 'Códigos e estatutos' },
  { id: 'jurisprudencia', label: 'Jurisprudência', icon: Landmark, desc: 'Súmulas e informativos' },
  { id: 'termos', label: 'Termos Jurídicos', icon: BookA, desc: 'Dicionário e jargões' },
  { id: 'juristas', label: 'Juristas', icon: Users, desc: 'Pensadores e doutrinadores' },
  { id: 'prazos', label: 'Prazos', icon: Clock, desc: 'Prazos processuais e materiais' },
  { id: 'excecoes', label: 'Exceções', icon: AlertTriangle, desc: 'Regras de exceção' },
  { id: 'classificacoes', label: 'Classificações', icon: ListTree, desc: 'Divisões e doutrinas' },
];

export default function AdminFlashcardsEditar() {
  const navigate = useNavigate();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];

  const [step, setStep] = useState<Step>('categoria');
  const [selectedCategoria, setSelectedCategoria] = useState<{id: string, label: string} | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('');
  
  const [temas, setTemas] = useState<TemaRow[]>([]);
  const [loadingTemas, setLoadingTemas] = useState(false);
  const [busca, setBusca] = useState('');

  // Form
  const [novoTema, setNovoTema] = useState('');
  const [quantidade, setQuantidade] = useState<number>(20);
  const [gerando, setGerando] = useState(false);
  const [fonteTipo, setFonteTipo] = useState<string>('livre');
  const [fonteConteudo, setFonteConteudo] = useState('');
  const [fonteFile, setFonteFile] = useState<File | null>(null);
  
  // Sugestões
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [gerandoSugestoes, setGerandoSugestoes] = useState(false);

  // Leis Secas
  const [leis, setLeis] = useState<any[]>([]);
  const [loadingLeis, setLoadingLeis] = useState(false);
  const [selectedLei, setSelectedLei] = useState<any>(null);
  const [leiEstrutura, setLeiEstrutura] = useState<any[]>([]);
  const [loadingEstrutura, setLoadingEstrutura] = useState(false);
  const [leisQuantidade, setLeisQuantidade] = useState<number>(10);
  const [leisCategorias, setLeisCategorias] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'Admin Flashcards | Vade Mecum PRIME';
    
    // Busca áreas específicas de leis secas para não poluir com "Português", etc.
    supabase.from('vade_mecum_leis').select('categoria').then(({ data }) => {
      if (data) {
        const catSet = new Set(data.map(d => d.categoria).filter(Boolean));
        setLeisCategorias(Array.from(catSet).sort());
      }
    });
  }, []);

  useEffect(() => {
    if (step === 'temas' && selectedArea) {
      let isMounted = true;
      
      if (selectedCategoria?.id === 'leis') {
        const fetchLeis = async () => {
          setLoadingLeis(true);
          try {
            const { data, error } = await supabase
              .from('vade_mecum_leis')
              .select('*')
              .eq('categoria', selectedArea)
              .order('ordem', { ascending: true });
            
            if (error) throw error;
            if (isMounted) setLeis(data || []);
          } catch (err: any) {
            toast.error('Erro ao buscar leis: ' + err.message);
          } finally {
            if (isMounted) setLoadingLeis(false);
          }
        };
        fetchLeis();
      } else {
        const fetchTemas = async () => {
          setLoadingTemas(true);
          try {
            const { data, error } = await supabase.rpc('flashcards_temas', { _area: selectedArea });
            if (error) throw error;
            
            if (isMounted) {
              setTemas((data || []).map((t: any) => ({ ...t, area: selectedArea })));
            }
          } catch (err: any) {
            toast.error('Erro ao buscar temas: ' + err.message);
          } finally {
            if (isMounted) setLoadingTemas(false);
          }
        };
        fetchTemas();
      }

      return () => { isMounted = false; };
    }
  }, [step, selectedArea, selectedCategoria]);

  // Estrutura da Lei
  const handleSelecionarLei = async (lei: any) => {
    setSelectedLei(lei);
    setLoadingEstrutura(true);
    setLeiEstrutura([]);
    try {
      const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
        body: { acao: 'listar_estrutura', lei_id: lei.id }
      });
      if (error) throw error;
      setLeiEstrutura(data?.estrutura || []);
    } catch (err: any) {
      toast.error('Erro ao buscar estrutura da lei: ' + err.message);
    } finally {
      setLoadingEstrutura(false);
    }
  };

  const handleGerarLeiSeca = async (estrutura: any) => {
    if (!selectedArea) return toast.error('Selecione uma área primeiro');
    if (!selectedLei) return toast.error('Selecione uma lei');
    
    setGerando(true);
    toast.loading(`Gerando flashcards do ${estrutura.titulo}...`, { id: 'geracao' });
    try {
      const temaNome = `${selectedLei.nome_curto || selectedLei.nome} - ${estrutura.titulo}`;
      
      const { data, error } = await supabase.functions.invoke('admin-flashcards-leis', {
        body: { 
          acao: 'gerar_flashcards',
          area: selectedArea, 
          tema: temaNome,
          artigos: estrutura.artigos,
          quantidadePorArtigo: leisQuantidade
        }
      });

      if (error) throw error;
      toast.success(`${data?.total || 0} flashcards gerados com sucesso!`, { id: 'geracao' });
    } catch (err: any) {
      console.error(err);
      toast.error('Erro na geração: ' + err.message, { id: 'geracao' });
    } finally {
      setGerando(false);
    }
  };

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return temas;
    const q = busca.toLowerCase();
    return temas.filter(t => t.tema.toLowerCase().includes(q));
  }, [temas, busca]);

  const handleGerar = async () => {
    const temaTarget = novoTema.trim();
    if (!selectedArea) return toast.error('Selecione uma área primeiro');
    if (!selectedCategoria) return toast.error('Categoria inválida');
    if (!temaTarget) return toast.error('Digite o nome do tema/assunto');
    if (quantidade < 1 || quantidade > 50) return toast.error('Quantidade deve ser entre 1 e 50');

    setGerando(true);
    toast.loading(`Preparando geração de flashcards...`, { id: 'geracao' });
    
    let finalFonteConteudo = fonteConteudo;

    try {
      if (['pdf', 'audio'].includes(fonteTipo)) {
        if (!fonteFile) {
          throw new Error('Nenhum arquivo selecionado.');
        }
        toast.loading(`Fazendo upload do arquivo (${(fonteFile.size / 1024 / 1024).toFixed(2)}MB)...`, { id: 'geracao' });
        
        const fileExt = fonteFile.name.split('.').pop();
        const filePath = `temp/${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('flashcards-fontes')
          .upload(filePath, fonteFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicData } = supabase.storage.from('flashcards-fontes').getPublicUrl(filePath);
        finalFonteConteudo = publicData.publicUrl;
      }

      toast.loading(`Gerando ${quantidade} flashcards de ${selectedCategoria.label}...`, { id: 'geracao' });
      
      const { data, error } = await supabase.functions.invoke('admin-flashcards-gerar', {
        body: { 
          area: selectedArea, 
          tema: temaTarget, 
          quantidade,
          categoria: selectedCategoria.label,
          fonteTipo,
          fonteConteudo: finalFonteConteudo
        }
      });

      if (error) throw error;

      toast.success(`${data?.total || 0} flashcards criados com sucesso!`, { id: 'geracao' });
      setNovoTema('');
      setFonteFile(null);
      setFonteConteudo('');
      
      // Atualiza lista local
      const { data: newData } = await supabase.rpc('flashcards_temas', { _area: selectedArea });
      if (newData) setTemas(newData.map((t: any) => ({ ...t, area: selectedArea })));

    } catch (err: any) {
      console.error(err);
      toast.error('Erro na geração: ' + err.message, { id: 'geracao' });
    } finally {
      setGerando(false);
    }
  };

  const handleSugerirTemas = async () => {
    if (!selectedArea || !selectedCategoria) return;
    setGerandoSugestoes(true);
    toast.loading('Analisando temas existentes e buscando sugestões...', { id: 'sugestao' });
    try {
      const temasAtuais = temas.map(t => t.tema);
      const { data, error } = await supabase.functions.invoke('admin-flashcards-gerar', {
        body: {
          acao: 'sugerir',
          area: selectedArea,
          categoria: selectedCategoria.label,
          temasExistentes: temasAtuais
        }
      });
      if (error) throw error;
      if (data?.sugestoes) {
        setSugestoes(data.sugestoes);
        toast.success('Sugestões geradas!', { id: 'sugestao' });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar sugestões: ' + err.message, { id: 'sugestao' });
    } finally {
      setGerandoSugestoes(false);
    }
  };

  const handleApagarTema = async (temaName: string) => {
    if (!confirm(`Tem certeza que deseja APAGAR TODOS os flashcards do tema "${temaName}"? Esta ação é irreversível.`)) return;

    try {
      const { error } = await supabase
        .from('flashcards_cards')
        .delete()
        .eq('area', selectedArea)
        .eq('tema', temaName);

      if (error) throw error;
      toast.success(`Tema ${temaName} apagado.`);
      setTemas(prev => prev.filter(t => t.tema !== temaName));
    } catch (err: any) {
      toast.error('Erro ao apagar: ' + err.message);
    }
  };

  const renderCategorias = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-display uppercase">Escolha a Categoria</h2>
        <p className="text-muted-foreground">Qual o tipo de flashcard você deseja gerar ou editar?</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIAS.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoria({ id: cat.id, label: cat.label });
                setStep('area');
              }}
              className="bg-card border border-border/50 hover:border-amber-500/50 hover:bg-muted/30 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center group h-40"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/10 transition-all">
                <Icon className="w-6 h-6 text-muted-foreground group-hover:text-amber-500 transition-colors" />
              </div>
              <div>
                <h3 className="font-medium">{cat.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderAreas = () => {
    const isLeis = selectedCategoria?.id === 'leis';
    const visibleAreas = isLeis
      ? leisCategorias.map(c => ({ area: c }))
      : areas;

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-display uppercase">{selectedCategoria?.label}</h2>
          <p className="text-muted-foreground">Escolha a Área / Disciplina</p>
        </div>

        {loadingAreas && !isLeis ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : (
          <div className={`grid gap-4 ${isLeis ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
            {visibleAreas.map(a => (
              <button
                key={a.area}
                onClick={() => {
                  setSelectedArea(a.area);
                  setStep('temas');
                }}
                className={isLeis 
                  ? "bg-card border border-border/50 hover:border-amber-500/50 hover:bg-muted/30 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center group h-40"
                  : "bg-card border border-border/50 hover:border-amber-500/50 hover:bg-muted/30 transition-all rounded-xl p-4 flex items-center justify-between group"
                }
              >
                {isLeis ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/10 transition-all">
                      <Scale className="w-6 h-6 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-medium capitalize">{a.area.replace(/_/g, ' ')}</h3>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="font-medium truncate">{a.area}</span>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500" />
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTemas = () => (
    <div className="space-y-8 mt-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-display uppercase">{selectedArea}</h2>
        <p className="text-muted-foreground">Categoria: {selectedCategoria?.label}</p>
      </div>

      {/* Painel de Criação */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
        
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500" />
          Criar Novo Tema ({selectedCategoria?.label})
        </h2>

        <Tabs defaultValue="criar" className="relative z-10 w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="criar">Criar Manual</TabsTrigger>
            <TabsTrigger value="sugestao" className="gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Sugestões da IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="criar" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Nome do Tema</label>
                <Input 
                  placeholder="ex: Súmula Vinculante 14" 
                  value={novoTema} 
                  onChange={e => setNovoTema(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-muted-foreground">Fonte Base</label>
                <Select value={fonteTipo} onValueChange={setFonteTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livre">🤖 IA Livre (Padrão)</SelectItem>
                    <SelectItem value="web">🌐 Busca na Web</SelectItem>
                    <SelectItem value="youtube">🎥 Link do YouTube</SelectItem>
                    <SelectItem value="lei">⚖️ Link da Lei</SelectItem>
                    <SelectItem value="pdf">📄 Arquivo PDF</SelectItem>
                    <SelectItem value="audio">🎙️ Arquivo de Áudio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-1">
                <label className="text-sm font-medium text-muted-foreground">Qtd.</label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={quantidade} 
                    onChange={e => setQuantidade(parseInt(e.target.value) || 1)}
                  />
                  <Button 
                    onClick={handleGerar} 
                    disabled={gerando || !novoTema.trim() || (['pdf', 'audio'].includes(fonteTipo) && !fonteFile)} 
                    className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                  >
                    {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {['youtube', 'lei'].includes(fonteTipo) && (
              <div className="pt-2 animate-in fade-in zoom-in-95">
                <Input 
                  placeholder="Cole aqui a URL (Link)" 
                  value={fonteConteudo}
                  onChange={e => setFonteConteudo(e.target.value)}
                  className="border-amber-500/30 focus-visible:ring-amber-500"
                />
              </div>
            )}
            
            {['pdf', 'audio'].includes(fonteTipo) && (
              <div className="pt-2 animate-in fade-in zoom-in-95 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Selecione o arquivo ({fonteTipo.toUpperCase()})</label>
                <Input 
                  type="file" 
                  accept={fonteTipo === 'pdf' ? '.pdf' : 'audio/*'}
                  onChange={e => setFonteFile(e.target.files?.[0] || null)}
                  className="border-amber-500/30 focus-visible:ring-amber-500 cursor-pointer file:text-amber-500 file:bg-amber-500/10 file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 hover:file:bg-amber-500/20"
                />
                {fonteFile && <p className="text-xs text-muted-foreground mt-1">Tamanho: {(fonteFile.size / 1024 / 1024).toFixed(2)} MB</p>}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              A IA será direcionada automaticamente para o formato de <strong>{selectedCategoria?.label}</strong>.
            </p>
          </TabsContent>

          <TabsContent value="sugestao" className="space-y-4">
            <div className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-4">
              <p className="text-sm text-muted-foreground">
                O Gemini vai analisar os {temas.length} temas que você já cadastrou em <strong>{selectedArea}</strong> e cruzar com os editais mais recentes para sugerir assuntos importantes que estão faltando.
              </p>
              <Button 
                onClick={handleSugerirTemas} 
                disabled={gerandoSugestoes}
                className="w-full sm:w-auto"
                variant="outline"
              >
                {gerandoSugestoes ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-amber-500" />}
                Analisar e Sugerir
              </Button>

              {sugestoes.length > 0 && (
                <div className="mt-6 space-y-2 animate-in slide-in-from-bottom-4">
                  <h4 className="font-medium text-sm">Sugestões (Clique para criar):</h4>
                  <div className="flex flex-wrap gap-2">
                    {sugestoes.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setNovoTema(sug);
                          setFonteTipo('livre');
                          // Não podemos trocar de aba diretamente sem ref local, mas podemos só preencher o input.
                          toast.success(`Tema preenchido. Volte à aba "Criar Manual" para gerar.`);
                        }}
                        className="text-left text-sm bg-background border border-border/50 hover:border-amber-500/50 hover:bg-muted p-3 rounded-xl transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Lista de Temas */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h3 className="font-medium text-lg">Temas Existentes</h3>
          <Input 
            placeholder="Buscar tema..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
            className="max-w-xs"
          />
        </div>

        {loadingTemas ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : listaFiltrada.length === 0 ? (
          <div className="text-center p-8 bg-muted/20 rounded-xl border border-dashed border-border/50 text-muted-foreground">
            Nenhum tema encontrado nesta área.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listaFiltrada.map(t => {
              const isTermo = selectedCategoria?.id === 'termos' || t.tema.toLowerCase().includes('termo');
              const isJuris = selectedCategoria?.id === 'jurisprudencia' || t.tema.toLowerCase().includes('súmula') || t.tema.toLowerCase().includes('info');
              
              return (
                <div key={t.tema} className="bg-card border border-border/40 rounded-xl p-5 flex flex-col justify-between group hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-900/5 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm leading-tight text-foreground/90 group-hover:text-amber-500 transition-colors" title={t.tema}>{t.tema}</h4>
                      {(isTermo || isJuris) && (
                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isTermo ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                          {isTermo ? 'Termos' : 'Juris'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                        <Layers className="w-3 h-3" />
                        <span className="font-medium text-foreground">{t.total} cards</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-5 pt-4 border-t border-border/30 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNovoTema(t.tema);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="h-8 text-xs font-medium text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 -ml-2"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Expansão
                    </Button>
                    <button 
                      onClick={() => handleApagarTema(t.tema)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      title="Apagar todos os cards deste tema"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      <PageHeader 
        title="Geração de Flashcards" 
        subtitle="Crie cards em lote via IA" 
        onBack={() => {
          if (step === 'temas') setStep('area');
          else if (step === 'area') setStep('categoria');
          else navigate('/admin-funcoes');
        }} 
      />

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {step === 'categoria' && renderCategorias()}
        {step === 'area' && renderAreas()}
        {step === 'temas' && selectedCategoria?.id !== 'leis' && renderTemas()}
        {step === 'temas' && selectedCategoria?.id === 'leis' && <WizardLeisSecas selectedArea={selectedArea} />}
      </div>
    </div>
  );
}
