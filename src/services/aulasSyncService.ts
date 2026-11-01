import { supabase } from '@/integrations/supabase/client';
import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';

const ANONYMOUS_USER_KEY = 'aulas_trilhas_anon_user_id';
const LOCAL_PROGRESSO_KEY = 'aulas_interativas_progresso_v1';
const LOCAL_FLASHCARDS_KEY = 'aulas_interativas_flashcards_v1';
const LOCAL_QUESTOES_KEY = 'aulas_interativas_questoes_v1';
const LOCAL_FAVORITOS_KEY = 'aulas_interativas_favoritos_v1';

export interface AulaProgressoDb {
  aula_id: string;
  disciplina_id: string;
  materia_id: string;
  etapa_atual: number;
  total_etapas: number;
  aula_terminada: boolean;
  flashcards_revisados: boolean;
  questoes_praticadas: boolean;
  acertos_questoes: number;
  total_questoes: number;
  tempo_estudo_segundos: number;
  concluida_em: string | null;
  updated_at: string;
}

/**
 * Obtém o UUID do usuário logado ou gera um identificador único persistente
 */
export async function getEffectiveUserId(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return user.id;
    }
  } catch (err) {
    console.warn('[aulasSync] Falha ao checar auth:', err);
  }

  // Fallback anônimo persistente
  let anonId = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (!anonId) {
    anonId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : 'anon-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
    localStorage.setItem(ANONYMOUS_USER_KEY, anonId);
  }
  return anonId;
}

/**
 * Carrega todos os progressos do Supabase (com fallback/merge no cache local)
 */
export async function carregarProgressoSupabase(): Promise<{
  progressoMap: Record<string, { etapaAtual: number }>;
  flashcardsMap: Record<string, boolean>;
  questoesMap: Record<string, boolean>;
  acertosMap: Record<string, { acertos: number; total: number }>;
}> {
  // Inicializa com dados locais (0ms de latência)
  let localProg: Record<string, { etapaAtual: number }> = {};
  let localFc: Record<string, boolean> = {};
  let localQues: Record<string, boolean> = {};
  let localAcertos: Record<string, { acertos: number; total: number }> = {};

  try {
    const rawProg = localStorage.getItem(LOCAL_PROGRESSO_KEY);
    if (rawProg) localProg = JSON.parse(rawProg);
    const rawFc = localStorage.getItem(LOCAL_FLASHCARDS_KEY);
    if (rawFc) localFc = JSON.parse(rawFc);
    const rawQues = localStorage.getItem(LOCAL_QUESTOES_KEY);
    if (rawQues) localQues = JSON.parse(rawQues);
  } catch {}

  try {
    const userId = await getEffectiveUserId();
    const { data, error } = await supabase
      .from('aulas_trilhas_progresso')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('[aulasSync] Erro ao buscar progresso no Supabase:', error.message);
      return {
        progressoMap: localProg,
        flashcardsMap: localFc,
        questoesMap: localQues,
        acertosMap: localAcertos
      };
    }

    if (data && data.length > 0) {
      data.forEach((row: any) => {
        const id = row.aula_id;
        // Supabase tem prioridade ou faz merge
        localProg[id] = { etapaAtual: Math.max(localProg[id]?.etapaAtual || 0, row.etapa_atual || 0) };
        if (row.flashcards_revisados) localFc[id] = true;
        if (row.questoes_praticadas) localQues[id] = true;
        localAcertos[id] = {
          acertos: row.acertos_questoes || 0,
          total: row.total_questoes || 0
        };
      });

      // Atualiza cache local
      localStorage.setItem(LOCAL_PROGRESSO_KEY, JSON.stringify(localProg));
      localStorage.setItem(LOCAL_FLASHCARDS_KEY, JSON.stringify(localFc));
      localStorage.setItem(LOCAL_QUESTOES_KEY, JSON.stringify(localQues));
    }
  } catch (err) {
    console.warn('[aulasSync] Exceção ao sincronizar progresso:', err);
  }

  return {
    progressoMap: localProg,
    flashcardsMap: localFc,
    questoesMap: localQues,
    acertosMap: localAcertos
  };
}

/**
 * Salva e sincroniza o progresso no Supabase e no cache local
 */
export async function salvarProgressoSupabase(params: {
  aula: AulaItem;
  etapaAtual: number;
  aulaTerminada: boolean;
  flashcardsRevisados: boolean;
  questoesPraticadas: boolean;
  acertosQuestoes?: number;
  totalQuestoes?: number;
}): Promise<void> {
  const { aula, etapaAtual, aulaTerminada, flashcardsRevisados, questoesPraticadas, acertosQuestoes = 0, totalQuestoes = 0 } = params;

  // 1. Atualizar cache local imediatamente (0ms)
  try {
    const rawProg = localStorage.getItem(LOCAL_PROGRESSO_KEY);
    const progMap = rawProg ? JSON.parse(rawProg) : {};
    progMap[aula.id] = { etapaAtual };
    localStorage.setItem(LOCAL_PROGRESSO_KEY, JSON.stringify(progMap));

    if (flashcardsRevisados) {
      const rawFc = localStorage.getItem(LOCAL_FLASHCARDS_KEY);
      const fcMap = rawFc ? JSON.parse(rawFc) : {};
      fcMap[aula.id] = true;
      localStorage.setItem(LOCAL_FLASHCARDS_KEY, JSON.stringify(fcMap));
    }

    if (questoesPraticadas) {
      const rawQues = localStorage.getItem(LOCAL_QUESTOES_KEY);
      const quesMap = rawQues ? JSON.parse(rawQues) : {};
      quesMap[aula.id] = true;
      localStorage.setItem(LOCAL_QUESTOES_KEY, JSON.stringify(quesMap));
    }
  } catch (err) {
    console.warn('[aulasSync] Erro no cache local:', err);
  }

  // 2. Persistir no Supabase em segundo plano
  try {
    const userId = await getEffectiveUserId();
    const isCicloCompleto = aulaTerminada && flashcardsRevisados && questoesPraticadas;

    await supabase.from('aulas_trilhas_progresso').upsert({
      user_id: userId,
      aula_id: aula.id,
      disciplina_id: aula.disciplinaId,
      materia_id: aula.materiaId,
      etapa_atual: etapaAtual,
      total_etapas: aula.etapas || 0,
      aula_terminada: aulaTerminada,
      flashcards_revisados: flashcardsRevisados,
      questoes_praticadas: questoesPraticadas,
      acertos_questoes: acertosQuestoes,
      total_questoes: totalQuestoes,
      concluida_em: isCicloCompleto ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,aula_id'
    });
  } catch (err) {
    console.warn('[aulasSync] Falha ao enviar para o Supabase:', err);
  }
}

/**
 * Carrega a lista de IDs de aulas favoritas do usuário no Supabase
 */
export async function carregarFavoritosSupabase(): Promise<Set<string>> {
  let favoritosSet = new Set<string>();

  // Ler cache local
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITOS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) favoritosSet = new Set(arr);
    }
  } catch {}

  try {
    const userId = await getEffectiveUserId();
    const { data, error } = await supabase
      .from('aulas_trilhas_favoritos')
      .select('aula_id')
      .eq('user_id', userId);

    if (error) {
      console.warn('[aulasSync] Erro ao carregar favoritos do Supabase:', error.message);
      return favoritosSet;
    }

    if (data) {
      data.forEach((row: any) => favoritosSet.add(row.aula_id));
      localStorage.setItem(LOCAL_FAVORITOS_KEY, JSON.stringify(Array.from(favoritosSet)));
    }
  } catch (err) {
    console.warn('[aulasSync] Exceção ao carregar favoritos:', err);
  }

  return favoritosSet;
}

/**
 * Alterna favorito (liga/desliga) com persistência no Supabase e cache local
 */
export async function alternarFavoritoSupabase(aula: AulaItem, isFavoritoAtual: boolean): Promise<boolean> {
  const novoEstado = !isFavoritoAtual;

  // Atualizar cache local
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITOS_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    let novoArr: string[];
    if (novoEstado) {
      novoArr = Array.from(new Set([...arr, aula.id]));
    } else {
      novoArr = arr.filter(id => id !== aula.id);
    }
    localStorage.setItem(LOCAL_FAVORITOS_KEY, JSON.stringify(novoArr));
  } catch {}

  // Sincronizar Supabase
  try {
    const userId = await getEffectiveUserId();
    if (novoEstado) {
      await supabase.from('aulas_trilhas_favoritos').upsert({
        user_id: userId,
        aula_id: aula.id,
        disciplina_id: aula.disciplinaId,
        materia_id: aula.materiaId,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,aula_id'
      });
    } else {
      await supabase.from('aulas_trilhas_favoritos')
        .delete()
        .eq('user_id', userId)
        .eq('aula_id', aula.id);
    }
  } catch (err) {
    console.warn('[aulasSync] Erro ao sincronizar favorito com Supabase:', err);
  }

  return novoEstado;
}
