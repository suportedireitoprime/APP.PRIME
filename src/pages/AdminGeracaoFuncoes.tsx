import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Brain, Play, CheckCircle2, AlertCircle, Loader2, Pause, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { gerarQuestaoAcaoFrontend } from '@/services/questaoAcaoFrontend';
import type { AcaoTipo } from '@/hooks/useQuestaoAcao';

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
  const [disciplinas, setDisciplinas] = useState<{ disciplina: string; count: number }[]>([]);
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>('');
  
  // Opções de Geração
  const [selectedTipos, setSelectedTipos] = useState<Set<AcaoTipo>>(new Set(['grifo', 'lei', 'comentario']));
  const [soFaltantes, setSoFaltantes] = useState(true);

  // Status de Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, errors: 0 });
  const [currentQuestionInfo, setCurrentQuestionInfo] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  async function carregarEstatisticas() {
    setLoadingStats(true);
    try {
      const { data, error } = await supabase.rpc('get_questoes_disciplinas_count');
      if (error) {
        // Fallback case no rpc doesn't exist
        const { data: d2, error: e2 } = await supabase.from('questoes').select('disciplina');
        if (e2) throw e2;
        const counts = d2.reduce((acc: any, cur) => {
          const d = cur.disciplina || 'Sem disciplina';
          acc[d] = (acc[d] || 0) + 1;
          return acc;
        }, {});
        const arrayCounts = Object.entries(counts).map(([d, c]) => ({ disciplina: d, count: c as number }));
        setDisciplinas(arrayCounts.sort((a, b) => b.count - a.count));
      } else {
        setDisciplinas(data || []);
      }
    } catch (e: any) {
      toast.error('Erro ao carregar estatísticas: ' + e.message);
    } finally {
      setLoadingStats(false);
    }
  }

  const toggleTipo = (tipo: AcaoTipo) => {
    const next = new Set(selectedTipos);
    if (next.has(tipo)) next.delete(tipo);
    else next.add(tipo);
    setSelectedTipos(next);
  };

  async function iniciarGeracao() {
    if (selectedTipos.size === 0) return toast.error('Selecione pelo menos um tipo de recurso para gerar.');

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // 1. Fetch questions to process
      setCurrentQuestionInfo('Buscando questões no banco...');
      let query = supabase.from('questoes').select('*');
      if (selectedDisciplina && selectedDisciplina !== 'Todas') {
        query = query.eq('disciplina', selectedDisciplina);
      }
      
      const { data: questoes, error } = await query;
      if (error) throw error;
      if (!questoes || questoes.length === 0) {
        toast.info('Nenhuma questão encontrada para a seleção.');
        setIsGenerating(false);
        return;
      }

      const total = questoes.length;
      setProgress({ current: 0, total, success: 0, errors: 0 });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < questoes.length; i++) {
        if (signal.aborted) break;
        
        const q = questoes[i];
        setCurrentQuestionInfo(`Q${q.id} - ${q.disciplina} (${i + 1}/${total})`);
        
        const chave = `q:${q.id}`;
        let qHasError = false;

        for (const tipo of Array.from(selectedTipos)) {
          if (signal.aborted) break;

          let tipoChave = chave;
          if (tipo === 'comentario' || tipo === 'lei-erradas') tipoChave = `${chave}|v2`;

          if (soFaltantes) {
            const { data: cache } = await supabase
              .from('questoes_acoes_cache')
              .select('id')
              .eq('chave', tipoChave)
              .eq('tipo', tipo)
              .maybeSingle();
            if (cache) continue; // Pula pois já existe
          }

          setCurrentQuestionInfo(`Q${q.id} - Gerando ${tipo}...`);
          try {
            const payload = await gerarQuestaoAcaoFrontend(tipo, q);
            if (payload) {
              await supabase.from("questoes_acoes_cache").upsert({ chave: tipoChave, tipo, payload }, { onConflict: "chave,tipo" });
            }
          } catch (e) {
            console.error(`Erro ao gerar ${tipo} para ${q.id}:`, e);
            qHasError = true;
          }
          
          // Delay to prevent hitting rate limits too harshly
          await new Promise(r => setTimeout(r, 1000));
        }

        if (qHasError) errorCount++;
        else successCount++;

        setProgress(prev => ({ ...prev, current: i + 1, success: successCount, errors: errorCount }));
      }
      
      if (!signal.aborted) {
        toast.success(`Geração concluída! Sucesso: ${successCount}, Erros: ${errorCount}`);
      } else {
        toast.info(`Geração interrompida. Sucesso: ${successCount}, Erros: ${errorCount}`);
      }

    } catch (e: any) {
      toast.error('Erro geral na geração: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
  }

  function pararGeracao() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  const tempoEstimadoSegundos = progress.total > 0 ? (progress.total * selectedTipos.size * 3) : 0; // ~3s por recurso
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
              <label className="text-sm font-semibold mb-2 block">Matéria / Disciplina alvo</label>
              <select 
                value={selectedDisciplina} 
                onChange={e => setSelectedDisciplina(e.target.value)}
                disabled={isGenerating || loadingStats}
                className="w-full bg-background border border-input rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Todas as matérias</option>
                {disciplinas.map(d => (
                  <option key={d.disciplina} value={d.disciplina}>{d.disciplina} ({d.count} questões)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Tipos de Recursos para Gerar</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_ACAO.map(tipo => (
                  <button
                    key={tipo.id}
                    onClick={() => toggleTipo(tipo.id)}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                      selectedTipos.has(tipo.id) 
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
                checked={soFaltantes}
                onChange={e => setSoFaltantes(e.target.checked)}
                disabled={isGenerating}
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
              <p className="text-2xl font-bold">{progress.current} <span className="text-sm text-muted-foreground font-normal">/ {progress.total}</span></p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Sucesso</p>
              <p className="text-2xl font-bold text-emerald-500">{progress.success}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Erros</p>
              <p className="text-2xl font-bold text-red-500">{progress.errors}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Tempo Est.</p>
              <p className="text-xl font-bold">{tempoEstimadoFormatado}</p>
            </div>
          </div>

          <div className="bg-[#0f1115] rounded-xl p-4 font-mono text-xs text-emerald-400 min-h-[100px] border border-border relative overflow-hidden">
            {isGenerating && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-primary animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
              </div>
            )}
            <p className="mb-2 opacity-50"># Console de Geração de IA</p>
            <p>{currentQuestionInfo || 'Aguardando início...'}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-4">
          {!isGenerating ? (
            <button
              onClick={iniciarGeracao}
              className="flex-1 bg-primary text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <Play className="w-5 h-5 fill-current" /> Iniciar Geração em Lote
            </button>
          ) : (
            <button
              onClick={pararGeracao}
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

// Dummy icon to avoid import error
function Activity(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
}
