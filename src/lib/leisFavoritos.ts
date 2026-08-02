// "Leis favoritas" — local (instantâneo) + sincronizado no Supabase por usuário
import { createSyncedList, registerForSync } from './userSync';

export type LeiFavorita = {
  tipo: string;
  leiId: string;
  nome: string;
  descricao: string;
  tabela_nome: string;
  favoritedAt: number;
};

const KEY = 'leis_favoritas_v1';
const EVT = 'leis:favoritos:changed';

const list = registerForSync(
  createSyncedList<LeiFavorita>({
    escopo: 'leis:favoritos',
    storageKey: KEY,
    keyOf: (l) => l.leiId,
    atOf: (l) => Number(l.favoritedAt) || 0,
    notify: () => window.dispatchEvent(new CustomEvent(EVT)),
  }),
);

export function getFavoritos(): LeiFavorita[] {
  return list.read();
}

export function isFavorito(leiId: string): boolean {
  return list.has(leiId);
}

export function addFavorito(lei: Omit<LeiFavorita, 'favoritedAt'>) {
  list.put({ ...lei, favoritedAt: Date.now() });
}

export function removeFavorito(leiId: string) {
  list.remove(leiId);
}

export function toggleFavorito(lei: Omit<LeiFavorita, 'favoritedAt'>): boolean {
  if (isFavorito(lei.leiId)) {
    removeFavorito(lei.leiId);
    return false;
  }
  addFavorito(lei);
  return true;
}

/** Baixa os favoritos salvos na conta e mescla com os locais. */
export const pullLeisFavoritos = (force = false) => list.pull(force);

export const LEIS_FAVORITOS_EVENT = EVT;
