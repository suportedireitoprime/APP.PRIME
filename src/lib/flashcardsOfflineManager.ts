import { supabase } from '@/integrations/supabase/client';

export interface Folder {
  id: string;
  name: string;
  created_at: string;
}

export interface OfflineFlashcard {
  id: string;
  deck_id: string;
  pergunta: string;
  resposta: string;
  status?: 'memorizado' | 'dificil' | 'errou' | null;
  exemplo?: string | null;
  dica?: string | null;
}

export interface Deck {
  id: string;
  nome: string;
  descricao?: string;
  materia?: string;
  total_cards: number;
  filtros?: any;
  created_at?: string;
  thumbnail?: string;
  tags?: string[];
  duration?: string;
  folderId?: string;
  cards_compreendidos?: number;
  cards_a_revisar?: number;
}

const DECKS_KEY = 'APP_PRIME_FLASHCARDS_DECKS';
const FOLDERS_KEY = 'APP_PRIME_FLASHCARDS_FOLDERS';
const CARDS_PREFIX = 'APP_PRIME_FLASHCARDS_CARDS_';

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

export function getOfflineFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveOfflineFolders(folders: Folder[]) {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {
    console.error('Erro ao salvar pastas offline', e);
  }
}

export function getOfflineCards(deckId: string): OfflineFlashcard[] {
  try {
    const raw = localStorage.getItem(`${CARDS_PREFIX}${deckId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveOfflineCards(deckId: string, cards: OfflineFlashcard[]) {
  try {
    localStorage.setItem(`${CARDS_PREFIX}${deckId}`, JSON.stringify(cards));
  } catch (e) {
    console.error(`Erro ao salvar cards offline do deck ${deckId}`, e);
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
