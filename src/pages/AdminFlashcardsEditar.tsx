import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Layers, Plus, Sparkles, Loader2, Trash2 } from 'lucide-react';
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

export default function AdminFlashcardsEditar() {
  const navigate = useNavigate();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];

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
    if (!selectedArea) {
      setTemas([]);
      return;
    }

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
  }, [selectedArea]);

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return temas;
    const q = busca.toLowerCase();
    return temas.filter(t => t.tema.toLowerCase().includes(q));
  }, [temas, busca]);

  const handleGerar = async () => {
    const temaTarget = novoTema.trim();
    if (!selectedArea) return toast.error('Selecione uma área primeiro');
    if (!temaTarget) return toast.error('Digite o nome do tema/assunto');
    if (quantidade < 1 || quantidade > 50) return toast.error('Quantidade deve ser entre 1 e 50');

    setGerando(true);
    toast.loading('Gerando flashcards com IA...', { id: 'geracao' });
    try {
      const { data, error } = await supabase.functions.invoke('admin-flashcards-gerar', {
        body: { area: selectedArea, tema: temaTarget, quantidade }
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

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      <PageHeader title="Geração de Flashcards" subtitle="Crie cards em lote via IA" onBack={() => navigate('/admin')} />

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 mt-4">
        
        {/* Painel de Criação */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>
          
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            Criar Novo Tema
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative z-10">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-medium text-muted-foreground">Área / Disciplina</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                disabled={loadingAreas}
              >
                <option value="">Selecione...</option>
                {areas.map(a => (
                  <option key={a.area} value={a.area}>{a.area}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Nome do Tema (ex: Súmula Vinculante 14)</label>
              <Input 
                placeholder="Qual o assunto?" 
                value={novoTema} 
                onChange={e => setNovoTema(e.target.value)}
                disabled={!selectedArea}
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
                  disabled={!selectedArea}
                />
                <Button 
                  onClick={handleGerar} 
                  disabled={gerando || !selectedArea || !novoTema.trim()} 
                  className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                >
                  {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            A geração usa o Gemini Flash Lite. O Hórus avisará automaticamente todos os usuários ao concluir.
          </p>
        </div>

        {/* Lista de Temas */}
        {selectedArea && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="font-medium text-lg">Temas em <span className="text-amber-500">{selectedArea}</span></h3>
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
        )}
      </div>
    </div>
  );
}
