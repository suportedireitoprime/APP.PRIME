import { supabase } from '@/integrations/supabase/client';
import { getAprenderCache, setAprenderCache } from '@/services/offlineDb';
import { getAreaCover } from './areasDireitoCovers';

export type AreaRow = { id: string; nome: string; descricao: string | null; cor: string | null };
export type ModuloRow = { id: string; titulo: string; ordem: number; resumo: string | null };
export type AulaRow = {
  id: string;
  modulo_id: string;
  titulo: string;
  objetivo: string | null;
  duracao_est_min: number;
  ordem: number;
  status?: string;
};
export type PendenteRow = {
  id: string;
  titulo: string;
  ordem: number;
  resumo: string | null;
};
export type ProgressoMap = Record<string, { concluida: boolean; pct: number }>;

export type AprenderAreaData = {
  area: AreaRow | null;
  modulos: ModuloRow[];
  aulas: AulaRow[];
  aulasPreparo: Record<string, number>;
  /** Aulas ainda não geradas (sumário sugerido) — geradas sob demanda. */
  pendentes: PendenteRow[];
  progresso: ProgressoMap;
};

type CacheEntry = { data: AprenderAreaData; timestamp: number };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de TTL

const memCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<AprenderAreaData>>();

const keyFor = (slug: string, uid: string | null) => `area:${slug}:${uid ?? 'anon'}`;

export function getCachedAprenderArea(slug: string, uid: string | null): AprenderAreaData | undefined {
  const entry = memCache.get(keyFor(slug, uid));
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    memCache.delete(keyFor(slug, uid));
    return undefined;
  }
  return entry.data;
}

/** Hidrata memória a partir do IndexedDB (chamar cedo na app). */
export async function hydrateAprenderAreaCache(slug: string, uid: string | null) {
  const key = keyFor(slug, uid);
  const cached = getCachedAprenderArea(slug, uid);
  if (cached) return cached;
  const persisted = await getAprenderCache<AprenderAreaData>(key);
  if (persisted) {
    memCache.set(key, { data: persisted, timestamp: Date.now() });
    return persisted;
  }
  return null;
}

export async function fetchAprenderAreaFromNetwork(
  slug: string,
  uid: string | null,
): Promise<AprenderAreaData> {
  const { data: a } = await supabase
    .from('aprender_areas')
    .select('id, nome, descricao, cor')
    .eq('slug', slug)
    .maybeSingle();
  if (!a) {
    return { area: null, modulos: [], aulas: [], aulasPreparo: {}, pendentes: [], progresso: {} };
  }
  const { data: mods } = await supabase
    .from('aprender_modulos')
    .select('id, titulo, ordem, resumo')
    .eq('area_id', a.id)
    .order('ordem');
  const modIds = (mods ?? []).map((m: any) => m.id);
  let publicadas: AulaRow[] = [];
  const preparo: Record<string, number> = {};
  const progresso: ProgressoMap = {};

  if (modIds.length) {
    const { data: ausTodas } = await supabase
      .from('aprender_aulas')
      .select('id, modulo_id, titulo, objetivo, duracao_est_min, ordem, status')
      .in('modulo_id', modIds)
      .order('ordem')
      .limit(3000);
    publicadas = ((ausTodas ?? []).filter((x: any) => x.status === 'published') as AulaRow[]);
    (ausTodas ?? []).forEach((x: any) => {
      if (x.status !== 'published') preparo[x.modulo_id] = (preparo[x.modulo_id] || 0) + 1;
    });

    if (uid && publicadas.length) {
      const ids = publicadas.map((x) => x.id);
      const [progRes, blocoRes] = await Promise.all([
        supabase
          .from('aprender_progresso_aula')
          .select('aula_id, concluida_em, blocos_concluidos')
          .eq('user_id', uid)
          .in('aula_id', ids)
          .limit(3000),
        supabase.from('aprender_blocos').select('aula_id').in('aula_id', ids).limit(25000),
      ]);
      const totals: Record<string, number> = {};
      (blocoRes.data ?? []).forEach((b: any) => {
        totals[b.aula_id] = (totals[b.aula_id] || 0) + 1;
      });
      (progRes.data ?? []).forEach((p: any) => {
        const isConcluida = !!p.concluida_em;
        const total = totals[p.aula_id] || 1;
        const pctCalculado = isConcluida
          ? 100
          : Math.min(100, Math.max(0, Math.round(((p.blocos_concluidos || 0) / total) * 100)));
        progresso[p.aula_id] = {
          concluida: isConcluida,
          pct: pctCalculado,
        };
      });
    }
  }

  const { data: sugestoes } = await supabase
    .from('aprender_sumario_sugerido')
    .select('id, titulo_melhorado, titulo_original, resumo_capitulo, ordem, aula_id')
    .eq('area_id', a.id)
    .is('aula_id', null)
    .order('ordem');
  const pendentes: PendenteRow[] = (sugestoes ?? []).map((s: any) => ({
    id: s.id,
    titulo: s.titulo_melhorado || s.titulo_original || 'Aula',
    ordem: Number(s.ordem) || 0,
    resumo: s.resumo_capitulo ?? null,
  }));

  return {
    area: a as AreaRow,
    modulos: (mods ?? []) as ModuloRow[],
    aulas: publicadas,
    aulasPreparo: preparo,
    pendentes,
    progresso,
  };
}

/**
 * Stale-while-revalidate:
 *  - Retorna imediatamente do cache (memória → IndexedDB) se existir.
 *  - Em paralelo, refaz a query e atualiza memória + IndexedDB.
 *  - Sem cache algum: faz a rede e devolve.
 */
export async function loadAprenderArea(slug: string, uid: string | null): Promise<AprenderAreaData> {
  const key = keyFor(slug, uid);

  // 1) memória
  const cached = getCachedAprenderArea(slug, uid);
  if (cached) {
    revalidateAprenderArea(slug, uid);
    return cached;
  }

  // 2) IndexedDB
  const persisted = await getAprenderCache<AprenderAreaData>(key);
  if (persisted) {
    memCache.set(key, { data: persisted, timestamp: Date.now() });
    revalidateAprenderArea(slug, uid);
    return persisted;
  }

  // 3) rede (com dedupe)
  const flying = inflight.get(key);
  if (flying) return flying;
  const p = (async () => {
    const result = await fetchAprenderAreaFromNetwork(slug, uid);
    memCache.set(key, { data: result, timestamp: Date.now() });
    setAprenderCache(key, 'area', result);
    return result;
  })();
  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/** Refetch em background — atualiza cache sem bloquear UI. */
function revalidateAprenderArea(slug: string, uid: string | null) {
  const key = keyFor(slug, uid);
  if (inflight.has(key)) return;
  const p = (async () => {
    try {
      const fresh = await fetchAprenderAreaFromNetwork(slug, uid);
      memCache.set(key, { data: fresh, timestamp: Date.now() });
      await setAprenderCache(key, 'area', fresh);
      return fresh;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
}

export function prefetchAprenderArea(slug: string, uid: string | null) {
  const key = keyFor(slug, uid);
  const warmCover = (areaName?: string | null) => {
    const cover = getAreaCover(areaName);
    if (cover?.cover && typeof Image !== 'undefined') {
      const img = new Image();
      img.src = cover.cover;
    }
  };

  const cached = getCachedAprenderArea(slug, uid);
  if (cached) {
    warmCover(cached.area?.nome);
    revalidateAprenderArea(slug, uid);
    return;
  }

  if (inflight.has(key)) return;

  loadAprenderArea(slug, uid)
    .then((data) => warmCover(data.area?.nome))
    .catch(() => {});
}

/** Descarta o cache da área (usar após gerar uma aula sob demanda ou concluir estudo). */
export function invalidateAprenderArea(slug?: string, uid?: string | null) {
  if (!slug) {
    memCache.clear();
    moduloMemCache.clear();
    return;
  }
  if (uid !== undefined) {
    memCache.delete(keyFor(slug, uid));
  } else {
    for (const k of memCache.keys()) {
      if (k.startsWith(`area:${slug}:`)) {
        memCache.delete(k);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 🚀 Cache Dedicado de Módulo & Aulas (Carregamento Instantâneo / 0ms)
// ─────────────────────────────────────────────────────────────

export type ModuloCachedData = {
  modulo: {
    id: string;
    titulo: string;
    resumo: string | null;
    ordem: number;
    areaId: string;
    areaNome: string;
    areaSlug: string;
  };
  aulas: {
    id: string;
    titulo: string;
    objetivo: string | null;
    duracaoMin: number;
    ordem: number;
    status: string;
    concluida?: boolean;
    pct?: number;
  }[];
};

const moduloMemCache = new Map<string, { data: ModuloCachedData; timestamp: number }>();
const moduloInflight = new Map<string, Promise<ModuloCachedData>>();

export function setCachedModuloData(moduloId: string, uid: string | null, data: ModuloCachedData) {
  const key = `modulo:${moduloId}:${uid ?? 'anon'}`;
  moduloMemCache.set(key, { data, timestamp: Date.now() });
  void setAprenderCache(key, 'modulo', data).catch(() => {});
}

export function getCachedModuloData(moduloId: string, uid: string | null): ModuloCachedData | undefined {
  const key = `modulo:${moduloId}:${uid ?? 'anon'}`;
  const direct = moduloMemCache.get(key);
  if (direct && Date.now() - direct.timestamp <= CACHE_TTL_MS) {
    return direct.data;
  }

  // Busca em todas as áreas já carregadas em memCache
  for (const entry of memCache.values()) {
    const mod = entry.data.modulos?.find((m) => m.id === moduloId);
    if (mod) {
      const areaAulas = entry.data.aulas?.filter((a) => a.modulo_id === moduloId) ?? [];
      const moduloAulas = areaAulas.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        objetivo: a.objetivo,
        duracaoMin: a.duracao_est_min || 15,
        ordem: a.ordem,
        status: a.status || 'published',
        concluida: !!entry.data.progresso[a.id]?.concluida,
        pct: entry.data.progresso[a.id]?.pct || 0,
      }));

      const assembled: ModuloCachedData = {
        modulo: {
          id: mod.id,
          titulo: mod.titulo,
          resumo: mod.resumo,
          ordem: mod.ordem,
          areaId: entry.data.area?.id ?? '',
          areaNome: entry.data.area?.nome ?? 'Direito',
          areaSlug: entry.data.area?.slug ?? 'geral',
        },
        aulas: moduloAulas,
      };

      setCachedModuloData(moduloId, uid, assembled);
      return assembled;
    }
  }

  return undefined;
}

export async function hydrateModuloCache(moduloId: string, uid: string | null): Promise<ModuloCachedData | null> {
  const key = `modulo:${moduloId}:${uid ?? 'anon'}`;
  const hit = getCachedModuloData(moduloId, uid);
  if (hit) return hit;
  const persisted = await getAprenderCache<ModuloCachedData>(key);
  if (persisted) {
    moduloMemCache.set(key, { data: persisted, timestamp: Date.now() });
    return persisted;
  }
  return null;
}

export async function fetchAprenderModuloFromNetwork(
  moduloId: string,
  uid: string | null,
): Promise<ModuloCachedData> {
  const [modRes, aulasRes] = await Promise.all([
    supabase
      .from('aprender_modulos')
      .select('id, titulo, resumo, ordem, area_id, aprender_areas(id, nome, slug)')
      .eq('id', moduloId)
      .maybeSingle(),
    supabase
      .from('aprender_aulas')
      .select('id, titulo, objetivo, duracao_est_min, ordem, status')
      .eq('modulo_id', moduloId)
      .eq('status', 'published')
      .order('ordem'),
  ]);

  const rawMod = modRes.data;
  const relArea = rawMod ? (rawMod as any).aprender_areas : null;
  const areaData = Array.isArray(relArea) ? relArea[0] : relArea;

  const rawAulas = aulasRes.data ?? [];
  const concluidasSet = new Set<string>();

  if (uid && rawAulas.length > 0) {
    const aulaIds = rawAulas.map((a) => a.id);
    const { data: progData } = await supabase
      .from('aprender_progresso_aula')
      .select('aula_id, concluida_em')
      .eq('user_id', uid)
      .in('aula_id', aulaIds);

    ((progData as any[]) ?? []).forEach((p) => {
      if (p.concluida_em) concluidasSet.add(p.aula_id);
    });
  }

  const aulas = rawAulas.map((a) => ({
    id: a.id,
    titulo: a.titulo,
    objetivo: a.objetivo,
    duracaoMin: a.duracao_est_min || 15,
    ordem: a.ordem,
    status: a.status,
    concluida: concluidasSet.has(a.id),
  }));

  return {
    modulo: {
      id: rawMod?.id ?? moduloId,
      titulo: rawMod?.titulo ?? '',
      resumo: rawMod?.resumo ?? null,
      ordem: rawMod?.ordem ?? 1,
      areaId: rawMod?.area_id ?? areaData?.id ?? '',
      areaNome: areaData?.nome ?? 'Direito',
      areaSlug: areaData?.slug ?? 'geral',
    },
    aulas,
  };
}

export async function loadAprenderModulo(moduloId: string, uid: string | null): Promise<ModuloCachedData> {
  const key = `modulo:${moduloId}:${uid ?? 'anon'}`;
  const hit = getCachedModuloData(moduloId, uid);
  if (hit && hit.aulas.length > 0) {
    void fetchAprenderModuloFromNetwork(moduloId, uid)
      .then((fresh) => setCachedModuloData(moduloId, uid, fresh))
      .catch(() => {});
    return hit;
  }

  const persisted = await hydrateModuloCache(moduloId, uid);
  if (persisted && persisted.aulas.length > 0) {
    void fetchAprenderModuloFromNetwork(moduloId, uid)
      .then((fresh) => setCachedModuloData(moduloId, uid, fresh))
      .catch(() => {});
    return persisted;
  }

  const flying = moduloInflight.get(key);
  if (flying) return flying;

  const p = fetchAprenderModuloFromNetwork(moduloId, uid)
    .then((fresh) => {
      setCachedModuloData(moduloId, uid, fresh);
      return fresh;
    })
    .finally(() => {
      moduloInflight.delete(key);
    });

  moduloInflight.set(key, p);
  return p;
}

