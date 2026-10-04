import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { gerarQuestaoAcaoFrontend } from '@/services/questaoAcaoFrontend';
import type { AcaoTipo } from '@/hooks/useQuestaoAcao';
import { toast } from 'sonner';

interface ProgressInfo {
  current: number;
  total: number;
  success: number;
  errors: number;
}

interface GeracaoBatchStore {
  isGenerating: boolean;
  progress: ProgressInfo;
  currentQuestionInfo: string;
  abortController: AbortController | null;

  fonteSelecionada: string;
  selectedTipos: Set<AcaoTipo>;
  soFaltantes: boolean;

  setFonteSelecionada: (val: string) => void;
  toggleTipo: (tipo: AcaoTipo) => void;
  setSoFaltantes: (val: boolean) => void;

  iniciarGeracao: () => Promise<void>;
  pararGeracao: () => void;
}

function hashKey(enunciado: string) {
  let h = 0;
  for (let i = 0; i < enunciado.length; i++) {
    h = (Math.imul(h, 31) + enunciado.charCodeAt(i)) | 0;
  }
  return String(h);
}

export const useGeracaoBatchStore = create<GeracaoBatchStore>((set, get) => ({
  isGenerating: false,
  progress: { current: 0, total: 0, success: 0, errors: 0 },
  currentQuestionInfo: '',
  abortController: null,

  fonteSelecionada: 'geral',
  selectedTipos: new Set(['grifo', 'lei', 'comentario']),
  soFaltantes: true,

  setFonteSelecionada: (val) => set({ fonteSelecionada: val }),
  
  toggleTipo: (tipo) => set((state) => {
    const next = new Set(state.selectedTipos);
    if (next.has(tipo)) next.delete(tipo);
    else next.add(tipo);
    return { selectedTipos: next };
  }),

  setSoFaltantes: (val) => set({ soFaltantes: val }),

  pararGeracao: () => {
    const ac = get().abortController;
    if (ac) ac.abort();
  },

  iniciarGeracao: async () => {
    const { selectedTipos, fonteSelecionada, soFaltantes, isGenerating } = get();
    
    if (isGenerating) return;
    if (selectedTipos.size === 0) {
      toast.error('Selecione pelo menos um tipo de recurso para gerar.');
      return;
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    set({ isGenerating: true, abortController, currentQuestionInfo: 'Buscando questões...' });

    try {
      let questoesToProcess: any[] = [];
      let fonteNome = "Banco Geral";

      if (fonteSelecionada === 'geral') {
        const { data, error } = await supabase.from('questoes').select('*');
        if (error) throw error;
        questoesToProcess = data.map((q, i) => ({
          id: q.id,
          isSimulado: false,
          qInfo: `Questão ${i + 1}`,
          mapped: q
        }));
      } else {
        const { data, error } = await supabase.from('simulado_questions').select('*').eq('simulado_id', fonteSelecionada);
        if (error) throw error;
        
        const { data: simData } = await supabase.from('simulados').select('year, simulado_exams(name)').eq('id', fonteSelecionada).single();
        if (simData) {
            fonteNome = `Simulado ${simData.simulado_exams?.name || ''} ${simData.year}`;
        } else {
            fonteNome = "Simulado Selecionado";
        }

        questoesToProcess = data.map((q, i) => {
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
            qInfo: `Questão ${i + 1}`,
            mapped,
            chaveBase: `h:${hashKey(q.text || '')}`
          };
        });
      }

      if (questoesToProcess.length === 0) {
        toast.info('Nenhuma questão encontrada para a seleção.');
        set({ isGenerating: false });
        return;
      }

      const total = questoesToProcess.length;
      set({ progress: { current: 0, total, success: 0, errors: 0 } });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < total; i++) {
        if (signal.aborted) break;
        
        const item = questoesToProcess[i];
        set({ currentQuestionInfo: `${fonteNome} - ${item.qInfo} (${i + 1}/${total})` });
        
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

          set({ currentQuestionInfo: `${fonteNome} - ${item.qInfo} - Gerando ${tipo}...` });
          
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

        set({ progress: { current: i + 1, total, success: successCount, errors: errorCount } });
      }
      
      if (!signal.aborted) {
        toast.success(`Geração concluída! Sucesso: ${successCount}, Erros: ${errorCount}`);
      } else {
        toast.info(`Geração interrompida. Sucesso: ${successCount}, Erros: ${errorCount}`);
      }

    } catch (e: any) {
      toast.error('Erro geral na geração: ' + e.message);
    } finally {
      set({ isGenerating: false });
    }
  }
}));
