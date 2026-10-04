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
  
  // Fontes:
  const [bancoGeralCount, setBancoGeralCount] = useState(0);
  const [simuladosList, setSimuladosList] = useState<any[]>([]);
  
  // Seleção
  const [fonteSelecionada, setFonteSelecionada] = useState<string>('geral'); // 'geral' ou simulado_id
  
  // Opções de Geração
  const [selectedTipos, setSelectedTipos] = useState<Set<AcaoTipo>>(new Set(['grifo', 'lei', 'comentario']));
  const [soFaltantes, setSoFaltantes] = useState(true);

  // Status de Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, errors: 0 });
  const [currentQuestionInfo, setCurrentQuestionInfo] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    carregarFontes();
  }, []);

  async function carregarFontes() {
    setLoadingStats(true);
    try {
      // 1. Contagem do banco geral
      const { count } = await supabase.from('questoes').select('*', { count: 'exact', head: true });
      setBancoGeralCount(count || 0);

      // 2. Simulados
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

  const toggleTipo = (tipo: AcaoTipo) => {
    const next = new Set(selectedTipos);
    if (next.has(tipo)) next.delete(tipo);
    else next.add(tipo);
    setSelectedTipos(next);
  };

  function hashKey(enunciado: string) {
    let h = 0;
    for (let i = 0; i < enunciado.length; i++) {
      h = (Math.imul(h, 31) + enunciado.charCodeAt(i)) | 0;
    }
    return String(h);
  }

  async function iniciarGeracao() {
    if (selectedTipos.size === 0) return toast.error('Selecione pelo menos um tipo de recurso para gerar.');

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setCurrentQuestionInfo('Buscando questões...');
      let questoesToProcess: any[] = [];

      if (fonteSelecionada === 'geral') {
        const { data, error } = await supabase.from('questoes').select('*');
        if (error) throw error;
        questoesToProcess = data.map(q => ({
          id: q.id,
          isSimulado: false,
          qInfo: `Geral Q${q.id}`,
          mapped: q
        }));
      } else {
        const { data, error } = await supabase.from('simulado_questions').select('*').eq('simulado_id', fonteSelecionada);
        if (error) throw error;
        questoesToProcess = data.map(q => {
          const mapped = {
            enunciado: q.text,
            alt_a: q.options?.A || '',
            alt_b: q.options?.B || '',
            alt_c: q.options?.C || '',
            alt_d: q.options?.D || '',
            alt_e: q.options?.E || '',
            gabarito: q.gabarito,
            disciplina: q.disciplina,
            assunto: q.assunto,
            comentario: q.correct_comment
          };
          return {
            id: q.id,
            isSimulado: true,
            qInfo: `Simulado Q${q.id}`,
            mapped,
            chaveBase: `h:${hashKey(q.text || '')}`
          };
        });
      }

      if (questoesToProcess.length === 0) {
        toast.info('Nenhuma questão encontrada para a seleção.');
        setIsGenerating(false);
        return;
      }

      const total = questoesToProcess.length;
      setProgress({ current: 0, total, success: 0, errors: 0 });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < total; i++) {
        if (signal.aborted) break;
        
        const item = questoesToProcess[i];
        setCurrentQuestionInfo(`${item.qInfo} (${i + 1}/${total})`);
        
        let qHasError = false;

        for (const tipo of Array.from(selectedTipos)) {
          if (signal.aborted) break;

          let tipoChave = item.isSimulado ? item.chaveBase : `q:${item.id}`;
          if (tipo === 'comentario' || tipo === 'lei-erradas') tipoChave = `${tipoChave}|v2`;

          if (soFaltantes) {
            const { data: cache } = await supabase
              .from('questoes_acoes_cache')
              .select('id')
              .eq('chave', tipoChave)
              .eq('tipo', tipo)
              .maybeSingle();
            if (cache) continue;
          }

          setCurrentQuestionInfo(`${item.qInfo} - Gerando ${tipo}...`);
          try {
            const payload = await gerarQuestaoAcaoFrontend(tipo, item.mapped);
            if (payload) {
              await supabase.from("questoes_acoes_cache").upsert({ chave: tipoChave, tipo, payload }, { onConflict: "chave,tipo" });
            }
          } catch (e) {
            console.error(`Erro ao gerar ${tipo} para ${item.qInfo}:`, e);
            qHasError = true;
          }
          
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

  const tempoEstimadoSegundos = progress.total > 0 ? (progress.total * selectedTipos.size * 3) : 0;
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
                value={fonteSelecionada} 
                onChange={e => setFonteSelecionada(e.target.value)}
                disabled={isGenerating || loadingStats}
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
