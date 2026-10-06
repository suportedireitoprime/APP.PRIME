import type { Questao } from '@/hooks/useQuestoes';
import { supabase } from '@/integrations/supabase/client';

export type SessaoHistorico = {
  id: string; // timestamp string (e.g. Date.now().toString())
  dataInicio: string; // ISO
  dataUltimoAcesso: string; // ISO
  filtroAplicado: string; 
  questoes: Questao[];
  respostas: Record<string, { escolha: string; acertou: boolean }>;
  idx: number;
  streak: number;
  contexto: string;
};

const STORAGE_KEY = 'APP_PRIME_SESSOES_HISTORICO';

export function getSessoes(): SessaoHistorico[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveSessao(sessao: SessaoHistorico) {
  const all = getSessoes();
  const idx = all.findIndex(s => s.id === sessao.id);
  if (idx >= 0) {
    all[idx] = sessao;
  } else {
    all.unshift(sessao);
  }
  // manter apenas as últimas 30 sessões localmente
  if (all.length > 30) all.length = 30;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar sessão (storage cheio?)', e);
  }
  
  // Fire and forget - Sincronizar remotamente
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase.from('questoes_sessoes_historico').upsert({
        sessao_id: sessao.id,
        user_id: user.id,
        data_inicio: sessao.dataInicio,
        data_ultimo_acesso: sessao.dataUltimoAcesso,
        filtro_aplicado: sessao.filtroAplicado,
        questoes: sessao.questoes as any,
        respostas: sessao.respostas as any,
        idx: sessao.idx,
        streak: sessao.streak,
        contexto: sessao.contexto
      }).then(({ error }) => {
        if (error) console.error('Supabase saveSessao error:', error);
      });
    }
  });
}

export function getSessaoById(id: string): SessaoHistorico | undefined {
  return getSessoes().find(s => s.id === id);
}

export function removeSessao(id: string) {
  const all = getSessoes().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase.from('questoes_sessoes_historico')
        .delete()
        .match({ sessao_id: id, user_id: user.id })
        .then();
    }
  });
}

/** Sincroniza sessoes locais que não estão no Supabase (usado no login) */
export async function syncQuestoesSessoesToRemote() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const local = getSessoes();
  if (local.length === 0) return;
  
  const payload = local.map(sessao => ({
    sessao_id: sessao.id,
    user_id: user.id,
    data_inicio: sessao.dataInicio,
    data_ultimo_acesso: sessao.dataUltimoAcesso,
    filtro_aplicado: sessao.filtroAplicado,
    questoes: sessao.questoes as any,
    respostas: sessao.respostas as any,
    idx: sessao.idx,
    streak: sessao.streak,
    contexto: sessao.contexto
  }));
  
  await supabase.from('questoes_sessoes_historico').upsert(payload, { onConflict: 'sessao_id,user_id' });
}
