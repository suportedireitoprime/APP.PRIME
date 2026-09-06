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

import { get as idbGet, set as idbSet } from 'idb-keyval';

const DECKS_KEY = 'APP_PRIME_FLASHCARDS_DECKS';
const FOLDERS_KEY = 'APP_PRIME_FLASHCARDS_FOLDERS';
const CARDS_PREFIX = 'APP_PRIME_FLASHCARDS_CARDS_';

let memDecks: Deck[] | null = null;
let memFolders: Folder[] | null = null;
const memCardsByDeck = new Map<string, OfflineFlashcard[]>();

export function getOfflineDecks(): Deck[] {
  if (memDecks && memDecks.length > 0) return memDecks;
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memDecks = parsed;
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function saveOfflineDecks(decks: Deck[]) {
  memDecks = decks;
  try {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch (e) {
    console.error('Erro ao salvar decks offline no localStorage', e);
  }
  void idbSet(DECKS_KEY, decks).catch(() => {});
}

export function getOfflineFolders(): Folder[] {
  if (memFolders && memFolders.length > 0) return memFolders;
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memFolders = parsed;
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function saveOfflineFolders(folders: Folder[]) {
  memFolders = folders;
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {
    console.error('Erro ao salvar pastas offline no localStorage', e);
  }
  void idbSet(FOLDERS_KEY, folders).catch(() => {});
}

export function getOfflineCards(deckId: string): OfflineFlashcard[] {
  const inMem = memCardsByDeck.get(deckId);
  if (inMem && inMem.length > 0) return inMem;
  try {
    const raw = localStorage.getItem(`${CARDS_PREFIX}${deckId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memCardsByDeck.set(deckId, parsed);
        return parsed;
      }
    }
  } catch {}
  return [];
}

export function saveOfflineCards(deckId: string, cards: OfflineFlashcard[]) {
  memCardsByDeck.set(deckId, cards);
  try {
    localStorage.setItem(`${CARDS_PREFIX}${deckId}`, JSON.stringify(cards));
  } catch (e) {
    console.error(`Erro ao salvar cards offline do deck ${deckId}`, e);
  }
  void idbSet(`${CARDS_PREFIX}${deckId}`, cards).catch(() => {});
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
  
  let localCache = getOfflineDecks();
  if (localCache.length === 0) {
    try {
      const fromIdb = await idbGet<Deck[]>(DECKS_KEY);
      if (fromIdb && Array.isArray(fromIdb) && fromIdb.length > 0) {
        localCache = fromIdb;
        memDecks = fromIdb;
      }
    } catch {}
  }
  let bundleDecks: Deck[] = [];
  try {
    const { bundle } = await import('@/services/offlineBundle');
    bundleDecks = await bundle.flashcardsDecks<Deck>();
  } catch {}

  // Mesclar cache local com o pacote offline, priorizando o cache local (mais recente)
  const map = new Map<string, Deck>();
  for (const d of bundleDecks) map.set(d.id, d);
  for (const d of localCache) map.set(d.id, d);

  return Array.from(map.values()).sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}
