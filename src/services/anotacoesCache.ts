/**
 * Cache persistente (Memória + localStorage + IndexedDB) para Anotações Pessoais.
 *
 * Garante que a listagem de anotações do usuário abra com 0ms e
 * permaneça 100% consultável em modo offline ou em conexões instáveis.
 */
import { get as idbGet, set as idbSet } from 'idb-keyval';

export type AnotacaoItem = {
  id: string;
  tabela_codigo: string;
  numero_artigo: string;
  anotacao: string | null;
  updated_at: string;
};

const PREFIX = 'anotacoes_pessoais:v1:';
const memAnotacoes = new Map<string, AnotacaoItem[]>();

function getStorageKey(userId?: string | null): string {
  return `${PREFIX}${userId || 'anon'}`;
}

/**
 * Retorna as anotações síncronas em memória ou localStorage (0ms de latência).
 */
export function getSyncAnotacoes(userId?: string | null): AnotacaoItem[] | null {
  const key = getStorageKey(userId);
  const inMem = memAnotacoes.get(key);
  if (inMem && inMem.length > 0) return inMem;

  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as AnotacaoItem[];
      memAnotacoes.set(key, parsed);
      return parsed;
    }
  } catch {
    /* noop */
  }
  return null;
}

/**
 * Recupera anotações persistidas em IndexedDB (se o localStorage estiver vazio).
 */
export async function getPersistedAnotacoes(userId?: string | null): Promise<AnotacaoItem[] | null> {
  const key = getStorageKey(userId);
  const inMem = memAnotacoes.get(key);
  if (inMem && inMem.length > 0) return inMem;

  try {
    const fromIdb = await idbGet<AnotacaoItem[]>(key);
    if (fromIdb && Array.isArray(fromIdb) && fromIdb.length > 0) {
      memAnotacoes.set(key, fromIdb);
      try {
        localStorage.setItem(key, JSON.stringify(fromIdb));
      } catch {}
      return fromIdb;
    }
  } catch {
    /* noop */
  }
  return null;
}

/**
 * Salva as anotações em RAM, localStorage e IndexedDB.
 */
export async function saveAnotacoes(userId: string | null | undefined, items: AnotacaoItem[]): Promise<void> {
  if (!items) return;
  const key = getStorageKey(userId);
  memAnotacoes.set(key, items);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* quota cheia */
    }
    try {
      await idbSet(key, items);
    } catch {
      /* noop */
    }
  }
}

/**
 * Adiciona ou atualiza uma anotação individual no cache local de forma atômica.
 */
export async function addAnotacaoItem(userId: string | null | undefined, item: AnotacaoItem): Promise<void> {
  const current = getSyncAnotacoes(userId) ?? (await getPersistedAnotacoes(userId)) ?? [];
  const next = [item, ...current.filter((i) => i.id !== item.id)];
  await saveAnotacoes(userId, next);
}

/**
 * Remove uma anotação do cache local de forma atômica.
 */
export async function removeAnotacaoItem(userId: string | null | undefined, id: string): Promise<void> {
  const current = getSyncAnotacoes(userId) ?? (await getPersistedAnotacoes(userId)) ?? [];
  const next = current.filter((i) => i.id !== id);
  await saveAnotacoes(userId, next);
}

