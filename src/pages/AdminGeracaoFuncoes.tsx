import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Brain, Play, Pause, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AcaoTipo } from '@/hooks/useQuestaoAcao';
import { useGeracaoBatchStore } from '@/stores/useGeracaoBatchStore';

const TIPOS_ACAO: { id: AcaoTipo; label: string }[] = [
  { id: 'comentario', label: 'Comentário' },
  { id: 'lei-erradas', label: 'Alternativas Erradas' },
  { id: 'aula', label: 'Mini-aula' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'lei', label: 'Lei Seca' },
  { id: 'pegadinhas', label: 'Pegadinhas' },
  { id: 'mapa', label: 'Mapa Mental' },
  { id: 'cornell', label: 'Resumo Cornell' },
  { id: 'termos', label: 'Termos' },
  { id: 'grifo', label: 'Grifos' }
];

export default function AdminGeracaoFuncoes() {
  const navigate = useNavigate();
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Fontes (UI apenas)
  const [bancoGeralCount, setBancoGeralCount] = useState(0);
  const [simuladosList, setSimuladosList] = useState<any[]>([]);

  // Store global
  const store = useGeracaoBatchStore();

  useEffect(() => {
    carregarFontes();
  }, []);

  async function carregarFontes() {
    setLoadingStats(true);
    try {
      const { count } = await supabase.from('questoes').select('*', { count: 'exact', head: true });
      setBancoGeralCount(count || 0);

      const { data: exams, error } = await supabase
        .from('simulado_exams')
        .select(`
          id, 
          name, 
          simulados (id, year, simulado_questions(count))
        `);
      if (error) throw error;
      
      const list: any[] = [];
      exams.forEach(exam => {
        exam.simulados?.forEach(sim => {
          list.push({
            id: sim.id,
            name: `${exam.name} - ${sim.year}`,
            count: sim.simulado_questions?.[0]?.count || 0
          });
        });
      });
      setSimuladosList(list.sort((a, b) => b.count - a.count));

    } catch (e: any) {
      toast.error('Erro ao carregar fontes: ' + e.message);
    } finally {
      setLoadingStats(false);
    }
  }

  const tempoEstimadoSegundos = store.progress.total > 0 ? (store.progress.total * store.selectedTipos.size * 3) : 0;
  const tempoEstimadoFormatado = tempoEstimadoSegundos > 0 
    ? (tempoEstimadoSegundos > 60 ? `${Math.ceil(tempoEstimadoSegundos / 60)} min` : `${tempoEstimadoSegundos} seg`) 
    : '--';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20">
      <PageHeader title="Geração de Funções (IA)" subtitle="Pré-processamento em lote" onBack={() => navigate('/admin-funcoes')} />
      
      <div className="p-4 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {/* Configurações */}
        <div className="border border-border bg-card rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-primary" /> Configuração do Batch
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Selecione a Fonte das Questões</label>
              <select 
                value={store.fonteSelecionada} 
                onChange={e => store.setFonteSelecionada(e.target.value)}
                disabled={store.isGenerating || loadingStats}
                className="w-full bg-background border border-input rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="geral">Todas as questões do Banco Geral ({bancoGeralCount})</option>
                <optgroup label="Simulados">
                  {simuladosList.map(sim => (
                    <option key={sim.id} value={sim.id}>{sim.name} ({sim.count} questões)</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Tipos de Recursos para Gerar</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_ACAO.map(tipo => (
                  <button
                    key={tipo.id}
                    onClick={() => store.toggleTipo(tipo.id)}
                    disabled={store.isGenerating}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                      store.selectedTipos.has(tipo.id) 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background text-muted-foreground border-input hover:border-primary/50'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                id="faltantes" 
                checked={store.soFaltantes}
                onChange={e => store.setSoFaltantes(e.target.checked)}
                disabled={store.isGenerating}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="faltantes" className="text-sm">
                Gerar apenas os recursos faltantes (não sobrescrever existentes)
              </label>
            </div>
          </div>
        </div>

        {/* Console / Status */}
        <div className="border border-border bg-card rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" /> Status e Progresso
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-background rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Progresso</p>
              <p className="text-2xl font-bold">{store.progress.current} <span className="text-sm text-muted-foreground font-normal">/ {store.progress.total}</span></p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Sucesso</p>
              <p className="text-2xl font-bold text-emerald-500">{store.progress.success}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Erros</p>
              <p className="text-2xl font-bold text-red-500">{store.progress.errors}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Tempo Est.</p>
              <p className="text-xl font-bold">{tempoEstimadoFormatado}</p>
            </div>
          </div>

          <div className="bg-[#0f1115] rounded-xl p-4 font-mono text-xs text-emerald-400 min-h-[100px] border border-border relative overflow-hidden">
            {store.isGenerating && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-primary animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
              </div>
            )}
            <p className="mb-2 opacity-50"># Console de Geração de IA</p>
            <p>{store.currentQuestionInfo || 'Aguardando início...'}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-4">
          {!store.isGenerating ? (
            <button
              onClick={() => store.iniciarGeracao()}
              className="flex-1 bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Play className="w-5 h-5 fill-current" /> Iniciar Geração em Lote
            </button>
          ) : (
            <button
              onClick={() => store.pararGeracao()}
              className="flex-1 bg-red-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
            >
              <Pause className="w-5 h-5 fill-current" /> Interromper
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function Activity(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
}
