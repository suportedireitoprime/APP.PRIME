/**
 * Cache persistente (Memória + localStorage + IndexedDB) para Locais Jurídicos.
 *
 * Elimina requisições redundantes de contagem de categorias e garante
 * que listas de fóruns, tribunais e delegacias abram instantaneamente (0ms)
 * mesmo em conexões lentas ou offline.
 */
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { CategoriaLocal } from '@/lib/locaisCategorias';
import type { Local, Contagens } from '@/components/locais/chunks';

const CONTAGENS_KEY = 'locais_juridicos:contagens:v1';
const CONTAGENS_AT_KEY = 'locais_juridicos:contagens_at:v1';
const LOCAIS_CAT_PREFIX = 'locais_juridicos:cat:v1:';

// TTL de 7 dias para as contagens gerais (dados estáticos cadastrais)
const CONTAGENS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Memória RAM volátil para leitura instantânea síncrona
let memContagens: Contagens | null = null;
const memLocaisPorCat = new Map<CategoriaLocal, Local[]>();

/**
 * Retorna as contagens síncronas em memória ou localStorage (0ms de latência).
 */
export function getSyncContagens(): Contagens | null {
  if (memContagens && Object.keys(memContagens).length > 0) {
    return memContagens;
  }
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONTAGENS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Contagens;
      memContagens = parsed;
      return parsed;
    }
  } catch {
    /* noop */
  }
  return null;
}

/**
 * Verifica se as contagens em cache ainda estão dentro do período de validade.
 */
export function isContagensFresh(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const at = Number(localStorage.getItem(CONTAGENS_AT_KEY) || 0);
    return Date.now() - at < CONTAGENS_TTL_MS;
  } catch {
    return false;
  }
}

/**
 * Salva as contagens em memória, localStorage e IndexedDB.
 */
export async function saveContagens(contagens: Contagens): Promise<void> {
  memContagens = contagens;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONTAGENS_KEY, JSON.stringify(contagens));
    localStorage.setItem(CONTAGENS_AT_KEY, String(Date.now()));
  } catch {
    /* quota cheia / storage privado */
  }
  try {
    await idbSet(CONTAGENS_KEY, contagens);
  } catch {
    /* noop */
  }
}

/**
 * Recupera locais em cache para uma determinada categoria (IndexedDB + RAM).
 */
export async function getPersistedLocaisCategoria(categoria: CategoriaLocal): Promise<Local[] | null> {
  const inMem = memLocaisPorCat.get(categoria);
  if (inMem && inMem.length > 0) return inMem;

  try {
    const fromIdb = await idbGet<Local[]>(`${LOCAIS_CAT_PREFIX}${categoria}`);
    if (fromIdb && Array.isArray(fromIdb) && fromIdb.length > 0) {
      memLocaisPorCat.set(categoria, fromIdb);
      return fromIdb;
    }
  } catch {
    /* noop */
  }
  return null;
}

/**
 * Salva a lista de locais de uma categoria em RAM e IndexedDB.
 */
export async function saveLocaisCategoria(categoria: CategoriaLocal, locais: Local[]): Promise<void> {
  if (!locais || locais.length === 0) return;
  memLocaisPorCat.set(categoria, locais);
  try {
    await idbSet(`${LOCAIS_CAT_PREFIX}${categoria}`, locais);
  } catch {
    /* noop */
  }
}
