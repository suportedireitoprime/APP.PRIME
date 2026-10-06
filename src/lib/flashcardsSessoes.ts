import { supabase } from '@/integrations/supabase/client';

export type FlashcardsSessaoHistorico = {
  id: string; // timestamp string (e.g. Date.now().toString())
  dataInicio: string; // ISO
  dataUltimoAcesso: string; // ISO
  queryString: string; // Ex: "areas=penal&limite=50"
  filtroAplicado: string; // Ex: "Penal, Civil - 50 Cards"
  cardsRevisados: number;
  totalCards: number;
};

const STORAGE_KEY = 'APP_PRIME_FLASHCARDS_SESSOES';

export function getFlashcardsSessoes(): FlashcardsSessaoHistorico[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveFlashcardsSessao(sessao: FlashcardsSessaoHistorico) {
  const all = getFlashcardsSessoes();
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
    console.error('Erro ao salvar sessão de flashcards (storage cheio?)', e);
  }

  // Fire and forget - Sincronizar remotamente
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase.from('flashcards_sessoes_historico').upsert({
        sessao_id: sessao.id,
        user_id: user.id,
        data_inicio: sessao.dataInicio,
        data_ultimo_acesso: sessao.dataUltimoAcesso,
        query_string: sessao.queryString,
        filtro_aplicado: sessao.filtroAplicado,
        cards_revisados: sessao.cardsRevisados,
        total_cards: sessao.totalCards
      }).then(({ error }) => {
        if (error) console.error('Supabase saveFlashcardsSessao error:', error);
      });
    }
  });
}

export function removeFlashcardsSessao(id: string) {
  const all = getFlashcardsSessoes().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      supabase.from('flashcards_sessoes_historico')
        .delete()
        .match({ sessao_id: id, user_id: user.id })
        .then();
    }
  });
}

/** Sincroniza sessoes locais que não estão no Supabase (usado no login) */
export async function syncFlashcardsSessoesToRemote() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const local = getFlashcardsSessoes();
  if (local.length === 0) return;
  
  const payload = local.map(sessao => ({
    sessao_id: sessao.id,
    user_id: user.id,
    data_inicio: sessao.dataInicio,
    data_ultimo_acesso: sessao.dataUltimoAcesso,
    query_string: sessao.queryString,
    filtro_aplicado: sessao.filtroAplicado,
    cards_revisados: sessao.cardsRevisados,
    total_cards: sessao.totalCards
  }));
  
  await supabase.from('flashcards_sessoes_historico').upsert(payload, { onConflict: 'sessao_id,user_id' });
}
