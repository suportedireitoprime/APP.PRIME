/**
 * Snapshot leve da home do Aprender guardado em localStorage.
 *
 * Diferente do snapshot em IndexedDB (assíncrono), este é lido de forma
 * SÍNCRONA no primeiro render — garantindo que a tela abra já pintada,
 * sem nenhum frame de skeleton para quem já visitou.
 */

export const APRENDER_HOME_VERSION = 2;

export type AprenderHomeArea = {
  id: string;
  slug: string;
  nome: string;
  cor: string | null;
  totalAulas: number;
  concluidas: number;
  pct: number;
};

export type AprenderHomeAula = {
  aulaId: string;
  titulo: string;
  areaNome: string;
  areaSlug: string;
  areaCor: string | null;
  blocosTotal: number;
  blocosFeitos: number;
  pct: number;
  atualizadoEm?: string | null;
};

export type AprenderHomeData = {
  areas: AprenderHomeArea[];
  emAndamento: AprenderHomeAula[];
  proxima: AprenderHomeAula | null;
  totalAulas: number;
  totalConcluidas: number;
  pctGeral: number;
};

type Stored = AprenderHomeData & { version: number; updatedAt: number };

const key = (uid: string | null) => `aprender:home:v${APRENDER_HOME_VERSION}:${uid ?? 'anon'}`;

export function readAprenderHomeLocal(uid: string | null): AprenderHomeData | null {
  try {
    const raw = localStorage.getItem(key(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.version !== APRENDER_HOME_VERSION) return null;
    if (!Array.isArray(parsed.areas)) return null;
    return {
      areas: parsed.areas,
      emAndamento: parsed.emAndamento ?? [],
      proxima: parsed.proxima ?? null,
      totalAulas: parsed.totalAulas ?? 0,
      totalConcluidas: parsed.totalConcluidas ?? 0,
      pctGeral: parsed.pctGeral ?? 0,
    };
  } catch {
    return null;
  }
}

export function writeAprenderHomeLocal(uid: string | null, data: AprenderHomeData) {
  try {
    const payload: Stored = { ...data, version: APRENDER_HOME_VERSION, updatedAt: Date.now() };
    localStorage.setItem(key(uid), JSON.stringify(payload));
  } catch {
    /* quota cheia — ignora */
  }
}

/** Limpa snapshots de versões antigas para não ocupar espaço à toa. */
export function pruneAprenderHomeLocal() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('aprender:home:v')) continue;
      if (!k.startsWith(`aprender:home:v${APRENDER_HOME_VERSION}:`)) localStorage.removeItem(k);
    }
  } catch {
    /* noop */
  }
}
