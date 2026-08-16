import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Layers, Plus, Sparkles, Loader2, Trash2, ArrowLeft, BookOpen, Scale, Landmark, BookA, Users, Clock, AlertTriangle, ListTree } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';

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

  useEffect(() => {
    document.title = 'Admin Flashcards | Vade Mecum PRIME';
  }, []);

  useEffect(() => {
    if (step === 'temas' && selectedArea) {
      let isMounted = true;
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
      return () => { isMounted = false; };
    }
  }, [step, selectedArea]);

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
    toast.loading(`Gerando ${quantidade} flashcards de ${selectedCategoria.label}...`, { id: 'geracao' });
    try {
      const { data, error } = await supabase.functions.invoke('admin-flashcards-gerar', {
        body: { 
          area: selectedArea, 
          tema: temaTarget, 
          quantidade,
          categoria: selectedCategoria.label
        }
      });

      if (error) throw error;

      toast.success(`${data?.total || 0} flashcards criados com sucesso!`, { id: 'geracao' });
      setNovoTema('');
      
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

  const renderAreas = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setStep('categoria')}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold font-display uppercase">{selectedCategoria?.label}</h2>
          <p className="text-muted-foreground">Escolha a Área / Disciplina</p>
        </div>
      </div>

      {loadingAreas ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {areas.map(a => (
            <button
              key={a.area}
              onClick={() => {
                setSelectedArea(a.area);
                setStep('temas');
              }}
              className="bg-card border border-border/50 hover:border-amber-500/50 hover:bg-muted/30 transition-all rounded-xl p-4 flex items-center justify-between group"
            >
              <span className="font-medium truncate">{a.area}</span>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 rotate-180" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderTemas = () => (
    <div className="space-y-8 mt-4">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setStep('area')}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold font-display uppercase">{selectedArea}</h2>
          <p className="text-muted-foreground">Categoria: {selectedCategoria?.label}</p>
        </div>
      </div>

      {/* Painel de Criação */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
        
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500" />
          Criar Novo Tema ({selectedCategoria?.label})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative z-10">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Nome do Tema (ex: Súmula Vinculante 14)</label>
            <Input 
              placeholder="Qual o assunto?" 
              value={novoTema} 
              onChange={e => setNovoTema(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-1">
            <label className="text-sm font-medium text-muted-foreground">Qtd. de Cards</label>
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
                disabled={gerando || !novoTema.trim()} 
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          A IA será direcionada automaticamente para o formato de <strong>{selectedCategoria?.label}</strong>.
        </p>
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
            {listaFiltrada.map(t => (
              <div key={t.tema} className="bg-card border border-border/40 rounded-xl p-4 flex flex-col justify-between group hover:border-amber-500/50 transition-colors">
                <div>
                  <h4 className="font-medium text-sm line-clamp-2" title={t.tema}>{t.tema}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{t.total} cards no total</p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/30">
                  <button 
                    onClick={() => {
                      setNovoTema(t.tema);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar mais
                  </button>
                  <button 
                    onClick={() => handleApagarTema(t.tema)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                    title="Apagar todos os cards deste tema"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
          else navigate('/admin');
        }} 
      />

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {step === 'categoria' && renderCategorias()}
        {step === 'area' && renderAreas()}
        {step === 'temas' && renderTemas()}
      </div>
    </div>
  );
}
