/**
 * Espelho local (síncrono) dos grifos mágicos por artigo.
 *
 * O texto do artigo pinta na hora (vem em memória), mas os grifos vinham só
 * depois de duas idas ao servidor em fila — daí o "delay" visível. Aqui
 * guardamos o último resultado conhecido em localStorage para que o artigo
 * abra já grifado, revalidando em segundo plano.
 */

export type MagicGrifoLite = {
  trechoExato: string;
  cor: string;
  explicacao?: string;
  hierarquia?: string;
};

const PREFIX = 'artigo-grifos-v1:';
const MAX_ENTRIES = 400;

function key(tabela: string, numero: string) {
  return `${PREFIX}${tabela}::${numero}`;
}

export function readArtigoGrifos(tabela?: string | null, numero?: string | null): MagicGrifoLite[] | null {
  if (!tabela || !numero || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key(tabela, numero));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MagicGrifoLite[]) : null;
  } catch {
    return null;
  }
}

export function writeArtigoGrifos(
  tabela?: string | null,
  numero?: string | null,
  grifos?: MagicGrifoLite[] | null,
): void {
  if (!tabela || !numero || typeof localStorage === 'undefined') return;
  try {
    if (!grifos || !grifos.length) {
      localStorage.removeItem(key(tabela, numero));
      return;
    }
    localStorage.setItem(key(tabela, numero), JSON.stringify(grifos));
    pruneArtigoGrifos();
  } catch {
    /* cota cheia — ignora */
  }
}

/** Mantém o cache enxuto: remove as entradas mais antigas quando passar do teto. */
export function pruneArtigoGrifos(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    if (keys.length <= MAX_ENTRIES) return;
    keys.slice(0, keys.length - MAX_ENTRIES).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
