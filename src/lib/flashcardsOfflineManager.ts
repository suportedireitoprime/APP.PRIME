import { supabase } from '@/integrations/supabase/client';

export type Deck = {
  id: string;
  nome: string;
  descricao: string | null;
  filtros: any;
  total_cards: number;
  created_at?: string;
};

const DECKS_KEY = 'APP_PRIME_FLASHCARDS_DECKS';

export function getOfflineDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveOfflineDecks(decks: Deck[]) {
  try {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch (e) {
    console.error('Erro ao salvar decks offline', e);
  }
}

/**
 * Busca os decks do Supabase e salva no cache local.
 * Caso o usuário esteja offline ou ocorra erro, retorna o cache local.
 */
export async function syncDecksOffline(): Promise<Deck[]> {
  try {
    const { data, error } = await supabase
      .from('flashcards_decks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      saveOfflineDecks(data as unknown as Deck[]);
      return data as unknown as Deck[];
    }
  } catch (err) {
    console.warn('Falha ao sincronizar decks online, usando fallback offline.', err);
  }
  
  return getOfflineDecks();
}
