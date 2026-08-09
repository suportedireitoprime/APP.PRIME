/**
 * Cache de dados das Videoaulas — memória → IndexedDB → rede.
 *
 * Regras de performance:
 *  - leitura síncrona do que já está em memória (render instantâneo, sem skeleton);
 *  - revalidação só quando o cache passa do TTL (antes revalidava SEMPRE, o que
 *    fazia cada navegação refazer selects de milhares de linhas nas 4 tabelas);
 *  - hidratação do IndexedDB uma única vez no boot, em idle.
 */
import { supabase } from '@/integrations/supabase/client';
import { getAprenderCacheEntry, setAprenderCache } from '@/services/offlineDb';
import { CATALOGOS, getCatalogo, slugify, type CatalogoId } from '@/lib/videoaulasCatalogos';

export type AulaCache = {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  ordem?: number | null;
  duracao_segundos?: number | null;
  thumb?: string | null;
  thumbnail?: string | null;
};

export type ProgressoRow = {
  video_id: string;
  tabela: string;
  percentual: number | null;
  concluida: boolean | null;
};

export type FavoritoRow = {
  video_id: string;
  tabela: string;
  titulo?: string | null;
  area?: string | null;
  thumb?: string | null;
};

export type ConcursoRow = {
  id: string;
  titulo: string;
  grupo: string;
  descricao: string;
  capa: string;
  disciplinas: string[];
};

/** Catálogo muda muito pouco: 24h. Progresso é do próprio usuário: 2min. Concursos: 24h */
const TTL_CATALOGO = 24 * 60 * 60 * 1000;
const TTL_PROGRESSO = 2 * 60 * 1000;
const TTL_FAVORITOS = 5 * 60 * 1000;
const TTL_CONCURSOS = 24 * 60 * 60 * 1000;

const memAulas = new Map<CatalogoId, AulaCache[]>();
const memAulasAt = new Map<CatalogoId, number>();
const inflight = new Map<string, Promise<any>>();

let memProgresso: ProgressoRow[] | null = null;
let memProgressoAt = 0;
let memFavoritos: FavoritoRow[] | null = null;
let memFavoritosAt = 0;
let memConcursos: ConcursoRow[] | null = null;
let memConcursosAt = 0;

const catKey = (id: CatalogoId) => `video:cat:${id}`;
const PROG_KEY = 'video:progresso';
const FAV_KEY = 'video:favoritos';
const CONCURSOS_KEY = 'video:concursos';

const fresco = (at: number, ttl: number) => at > 0 && Date.now() - at < ttl;

function onIdle(cb: () => void, timeout = 800) {
  const ric: any =
    (typeof window !== 'undefined' && (window as any).requestIdleCallback) ||
    ((fn: any) => setTimeout(fn, timeout));
  return ric(cb, { timeout });
}

/** Dedupe genérico de requisições em voo. */
function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const flying = inflight.get(key) as Promise<T> | undefined;
  if (flying) return flying;
  const p = run().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/* --------------------------------------------------------------- listeners */

type Listener = () => void;
const listeners = new Set<Listener>();

/** Permite às telas re-renderizar quando um cache é atualizado em background. */
export function subscribeVideoaulas(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notificar() {
  listeners.forEach((fn) => {
    try { fn(); } catch { /* noop */ }
  });
}

/* ------------------------------------------------------------------ aulas */

async function fetchCatalogo(id: CatalogoId): Promise<AulaCache[]> {
  const c = getCatalogo(id);
  if (!c) return [];
  const cols = `id, video_id, titulo, ordem, duracao_segundos, ${c.thumbCol}${
    c.temAreas ? ', area' : ''
  }`;
  const { data } = await supabase
    .from(c.tabela as any)
    .select(cols)
    .order('ordem', { ascending: true, nullsFirst: false })
    .limit(3000);
  return ((data as unknown as AulaCache[]) ?? []).filter((a) => a?.video_id);
}

function revalidateCatalogo(id: CatalogoId) {
  if (fresco(memAulasAt.get(id) ?? 0, TTL_CATALOGO)) return;
  const key = `revalidate:${catKey(id)}`;
  if (inflight.has(key)) return;
  void dedupe(key, async () => {
    const fresh = await fetchCatalogo(id);
    if (fresh.length) {
      memAulas.set(id, fresh);
      memAulasAt.set(id, Date.now());
      await setAprenderCache(catKey(id), 'area', fresh);
      notificar();
    }
    return fresh;
  }).catch(() => {});
}

export function getCachedCatalogo(id: CatalogoId): AulaCache[] | null {
  return memAulas.get(id) ?? null;
}

/** Aulas de um catálogo — instantâneo quando já há cache. */
export async function loadCatalogo(id: CatalogoId): Promise<AulaCache[]> {
  const mem = memAulas.get(id);
  if (mem) {
    revalidateCatalogo(id);
    return mem;
  }
  const persisted = await getAprenderCacheEntry<AulaCache[]>(catKey(id));
  if (persisted?.payload?.length) {
    memAulas.set(id, persisted.payload);
    memAulasAt.set(id, persisted.updatedAt);
    revalidateCatalogo(id);
    return persisted.payload;
  }
  return dedupe(catKey(id), async () => {
    const rows = await fetchCatalogo(id);
    memAulas.set(id, rows);
    memAulasAt.set(id, Date.now());
    void setAprenderCache(catKey(id), 'area', rows);
    notificar();
    return rows;
  });
}

function filtrarArea(id: CatalogoId, todas: AulaCache[], areaSlug?: string): AulaCache[] {
  const c = getCatalogo(id);
  if (!c?.temAreas || !areaSlug) return todas;
  return todas.filter((a) => slugify(a.area || 'Outros') === areaSlug);
}

/** Versão síncrona: usa só o que já está em memória (pode ser null). */
export function getCachedAulasDaArea(id: CatalogoId, areaSlug?: string): AulaCache[] | null {
  const todas = memAulas.get(id);
  if (!todas) return null;
  return filtrarArea(id, todas, areaSlug);
}

/** Aulas de uma área (slug) já filtradas, sem query nova. */
export async function loadAulasDaArea(id: CatalogoId, areaSlug?: string): Promise<AulaCache[]> {
  const todas = await loadCatalogo(id);
  return filtrarArea(id, todas, areaSlug);
}

/** Uma aula específica, direto do cache em memória (sem rede). */
export function getCachedAula(id: CatalogoId, videoId: string): AulaCache | null {
  return memAulas.get(id)?.find((a) => a.video_id === videoId) ?? null;
}

/* -------------------------------------------------------------- progresso */

async function fetchProgresso(): Promise<ProgressoRow[]> {
  const { data } = await supabase
    .from('videoaulas_progresso')
    .select('video_id, tabela, percentual, concluida, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1000);
  return ((data as any[]) ?? []) as ProgressoRow[];
}

function revalidateProgresso(forcar = false) {
  if (!forcar && fresco(memProgressoAt, TTL_PROGRESSO)) return;
  const key = 'revalidate:progresso';
  if (inflight.has(key)) return;
  void dedupe(key, async () => {
    const fresh = await fetchProgresso();
    memProgresso = fresh;
    memProgressoAt = Date.now();
    await setAprenderCache(PROG_KEY, 'home', fresh);
    notificar();
    return fresh;
  }).catch(() => {});
}

export function getCachedProgresso(): ProgressoRow[] | null {
  return memProgresso;
}

export async function loadProgresso(): Promise<ProgressoRow[]> {
  if (memProgresso) {
    revalidateProgresso();
    return memProgresso;
  }
  const persisted = await getAprenderCacheEntry<ProgressoRow[]>(PROG_KEY);
  if (persisted?.payload) {
    memProgresso = persisted.payload;
    memProgressoAt = persisted.updatedAt;
    revalidateProgresso();
    return persisted.payload;
  }
  return dedupe(PROG_KEY, async () => {
    const rows = await fetchProgresso();
    memProgresso = rows;
    memProgressoAt = Date.now();
    void setAprenderCache(PROG_KEY, 'home', rows);
    notificar();
    return rows;
  });
}

/** Chamar após salvar progresso para o cache não ficar velho. */
export function invalidarProgresso() {
  memProgressoAt = 0;
  revalidateProgresso(true);
}

/* -------------------------------------------------------------- favoritos */

async function fetchFavoritos(): Promise<FavoritoRow[]> {
  const { data } = await supabase
    .from('videoaulas_favoritos')
    .select('video_id, tabela, titulo, area, thumb')
    .order('created_at', { ascending: false })
    .limit(500);
  return ((data as any[]) ?? []) as FavoritoRow[];
}

function revalidateFavoritos(forcar = false) {
  if (!forcar && fresco(memFavoritosAt, TTL_FAVORITOS)) return;
  const key = 'revalidate:favoritos';
  if (inflight.has(key)) return;
  void dedupe(key, async () => {
    const fresh = await fetchFavoritos();
    memFavoritos = fresh;
    memFavoritosAt = Date.now();
    await setAprenderCache(FAV_KEY, 'home', fresh);
    notificar();
    return fresh;
  }).catch(() => {});
}

export function getCachedFavoritos(): FavoritoRow[] | null {
  return memFavoritos;
}

export async function loadFavoritos(): Promise<FavoritoRow[]> {
  if (memFavoritos) {
    revalidateFavoritos();
    return memFavoritos;
  }
  const persisted = await getAprenderCacheEntry<FavoritoRow[]>(FAV_KEY);
  if (persisted?.payload) {
    memFavoritos = persisted.payload;
    memFavoritosAt = persisted.updatedAt;
    revalidateFavoritos();
    return persisted.payload;
  }
  return dedupe(FAV_KEY, async () => {
    const rows = await fetchFavoritos();
    memFavoritos = rows;
    memFavoritosAt = Date.now();
    void setAprenderCache(FAV_KEY, 'home', rows);
    notificar();
    return rows;
  });
}

export function invalidarFavoritos() {
  memFavoritosAt = 0;
  revalidateFavoritos(true);
}

/* -------------------------------------------------------------- concursos */

async function fetchConcursos(): Promise<ConcursoRow[]> {
  const { data } = await supabase
    .from('trilhas_concursos')
    .select('*')
    .order('titulo', { ascending: true });
  return ((data as any[]) ?? []) as ConcursoRow[];
}

function revalidateConcursos(forcar = false) {
  if (!forcar && fresco(memConcursosAt, TTL_CONCURSOS)) return;
  const key = 'revalidate:concursos';
  if (inflight.has(key)) return;
  void dedupe(key, async () => {
    const fresh = await fetchConcursos();
    memConcursos = fresh;
    memConcursosAt = Date.now();
    await setAprenderCache(CONCURSOS_KEY, 'home', fresh);
    notificar();
    return fresh;
  }).catch(() => {});
}

export function getCachedConcursos(): ConcursoRow[] | null {
  return memConcursos;
}

export async function loadConcursos(): Promise<ConcursoRow[]> {
  if (memConcursos) {
    revalidateConcursos();
    return memConcursos;
  }
  const persisted = await getAprenderCacheEntry<ConcursoRow[]>(CONCURSOS_KEY);
  if (persisted?.payload) {
    memConcursos = persisted.payload;
    memConcursosAt = persisted.updatedAt;
    revalidateConcursos();
    return persisted.payload;
  }
  return dedupe(CONCURSOS_KEY, async () => {
    const rows = await fetchConcursos();
    memConcursos = rows;
    memConcursosAt = Date.now();
    void setAprenderCache(CONCURSOS_KEY, 'home', rows);
    notificar();
    return rows;
  });
}

/* ------------------------------------------------------------------ warmup */

let hidratado = false;

/**
 * Hidrata os caches do IndexedDB para a memória (sem rede quando estão frescos).
 * Chamar cedo, em idle, para que a primeira entrada em Videoaulas já pinte pronta.
 */
export function hydrateVideoaulasCache() {
  if (hidratado || typeof window === 'undefined') return;
  hidratado = true;
  onIdle(() => {
    CATALOGOS.forEach((c) => {
      if (memAulas.has(c.id)) return;
      void getAprenderCacheEntry<AulaCache[]>(catKey(c.id))
        .then((e) => {
          if (!e?.payload?.length || memAulas.has(c.id)) return;
          memAulas.set(c.id, e.payload);
          memAulasAt.set(c.id, e.updatedAt);
          notificar();
        })
        .catch(() => {});
    });
    void getAprenderCacheEntry<ProgressoRow[]>(PROG_KEY)
      .then((e) => {
        if (!e?.payload || memProgresso) return;
        memProgresso = e.payload;
        memProgressoAt = e.updatedAt;
        notificar();
      })
      .catch(() => {});
      
    void getAprenderCacheEntry<ConcursoRow[]>(CONCURSOS_KEY)
      .then((e) => {
        if (!e?.payload || memConcursos) return;
        memConcursos = e.payload;
        memConcursosAt = e.updatedAt;
        notificar();
      })
      .catch(() => {});
  }, 1500);
}

let warmed = false;

/** Aquece o que ainda não está em cache — sempre depois do primeiro paint. */
export function warmVideoaulasCache() {
  if (warmed) return;
  warmed = true;
  onIdle(() => {
    void loadProgresso().catch(() => {});
    void loadFavoritos().catch(() => {});
    void loadConcursos().catch(() => {});
    CATALOGOS.forEach((c, i) => {
      if (fresco(memAulasAt.get(c.id) ?? 0, TTL_CATALOGO)) return;
      setTimeout(() => {
        void loadCatalogo(c.id).catch(() => {});
      }, i * 250);
    });
  }, 2000);
}

export function prefetchCatalogo(id: CatalogoId) {
  void loadCatalogo(id).catch(() => {});
}
