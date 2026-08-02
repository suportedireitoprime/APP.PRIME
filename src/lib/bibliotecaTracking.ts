import type { LivroNormalizado } from './bibliotecaColecoes';
import { createSyncedList, registerForSync } from './userSync';

const FAV_KEY = 'biblioteca:favoritos:v1';
const REC_KEY = 'biblioteca:recentes:v1';
const MAX_REC = 40;

export type LivroSnapshot = Pick<
  LivroNormalizado,
  'id' | 'titulo' | 'autor' | 'sobre' | 'capa' | 'link' | 'download' | 'area' | 'colecaoId'
> & { at?: number };

const livroKey = (l: { colecaoId: string; id: string | number }) => `${l.colecaoId}:${l.id}`;

const notify = (key: string) => () => {
  try {
    window.dispatchEvent(new CustomEvent('biblioteca:tracking', { detail: { key } }));
  } catch {
    /* ignore */
  }
};

const favList = registerForSync(
  createSyncedList<LivroSnapshot>({
    escopo: 'biblioteca:favoritos',
    storageKey: FAV_KEY,
    keyOf: livroKey,
    atOf: (l) => Number(l.at) || 0,
    notify: notify(FAV_KEY),
  }),
);

const recList = registerForSync(
  createSyncedList<LivroSnapshot>({
    escopo: 'biblioteca:recentes',
    storageKey: REC_KEY,
    keyOf: livroKey,
    atOf: (l) => Number(l.at) || 0,
    max: MAX_REC,
    notify: notify(REC_KEY),
  }),
);

function toSnapshot(l: LivroNormalizado): LivroSnapshot {
  return {
    id: l.id,
    titulo: l.titulo,
    autor: l.autor ?? null,
    sobre: l.sobre ?? null,
    capa: l.capa ?? null,
    link: l.link ?? null,
    download: l.download ?? null,
    area: l.area ?? null,
    colecaoId: l.colecaoId,
  };
}

export function getFavoritos(): LivroSnapshot[] {
  return favList.read();
}

export function isFavorito(l: { colecaoId: string; id: string | number }): boolean {
  return favList.has(livroKey(l));
}

export function toggleFavorito(l: LivroNormalizado): boolean {
  const k = livroKey(l);
  if (favList.has(k)) {
    favList.remove(k);
    return false;
  }
  favList.put({ ...toSnapshot(l), at: Date.now() });
  return true;
}

export function getRecentes(): LivroSnapshot[] {
  return recList.read();
}

export function pushRecente(l: LivroNormalizado) {
  recList.put({ ...toSnapshot(l), at: Date.now() });
}

/** Baixa favoritos/recentes da conta e mescla com os locais. */
export async function pullBibliotecaTracking(force = false) {
  await Promise.all([favList.pull(force), recList.pull(force)]);
}

export function subscribeTracking(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener('biblioteca:tracking', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('biblioteca:tracking', handler);
    window.removeEventListener('storage', handler);
  };
}
