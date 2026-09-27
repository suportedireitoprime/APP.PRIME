import { supabase } from '@/integrations/supabase/client';
import { getResumosCatalog } from '@/services/resumosCatalog';
import type { CatalogoItem } from './catalogo';

export interface TemaResumo {
  tema: string;
  total: number;
}

const slug = (v: string) =>
  v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const STORAGE_AREAS_KEY = 'mapas_mentais_areas_cache_v1';

function carregarAreasLocalStorage(): CatalogoItem[] | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_AREAS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

let areasCache: CatalogoItem[] | null = carregarAreasLocalStorage();
const temasCache = new Map<string, TemaResumo[]>();

export function getCachedAreasResumos(): CatalogoItem[] | null {
  return areasCache;
}

/** Lê todas as linhas de resumos_juridicos em páginas (com fallback offline). */
async function lerResumos<T extends Record<string, unknown>>(
  colunas: string,
  filtro?: (q: any) => any,
): Promise<T[]> {
  const out: T[] = [];
  const step = 1000;
  let from = 0;
  while (true) {
    let q: any = (supabase.from('resumos_juridicos') as any)
      .select(colunas)
      .range(from, from + step - 1);
    if (filtro) q = filtro(q);
    const { data, error } = await q;
    if (error) break;
    if (!data?.length) break;
    out.push(...(data as T[]));
    if (data.length < step) break;
    from += step;
  }
  if (!out.length) {
    try {
      const catalog = await getResumosCatalog();
      const rows: Array<Record<string, unknown>> = [];
      for (const c of catalog) {
        for (const t of c.temas) {
          if (t.subtemas && t.subtemas.length > 0) {
            for (const s of t.subtemas) {
              rows.push({
                area: c.area,
                tema: t.tema,
                subtema: s.subtema,
                ordem_subtema: s.ordem ?? 1,
              });
            }
          } else {
            rows.push({
              area: c.area,
              tema: t.tema,
            });
          }
        }
      }
      return rows as T[];
    } catch {
      return [];
    }
  }
  return out;
}

/** Matérias reaproveitadas da tabela de resumos jurídicos (áreas) — Carregamento a 0ms */
export async function fetchAreasResumos(): Promise<CatalogoItem[]> {
  if (areasCache && areasCache.length > 0) return areasCache;

  // 1. Tenta carregar instantâneo do catálogo local compilado (0ms)
  try {
    const catalog = await getResumosCatalog();
    if (catalog && catalog.length > 0) {
      const itens: CatalogoItem[] = catalog.map((c) => ({
        key: `materia:${slug(c.area)}`,
        label: c.area,
        sub: `${c.temas?.length || c.total || 1} ${(c.temas?.length || c.total || 1) === 1 ? 'tópico' : 'tópicos'} de resumo`,
        contexto: `Matéria jurídica brasileira: ${c.area}. Panorama geral dos institutos centrais da disciplina.`,
      })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

      areasCache = itens;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_AREAS_KEY, JSON.stringify(itens));
        }
      } catch {}
      return itens;
    }
  } catch {}

  // 2. Fallback remoto
  const rows = await lerResumos<{ area: string; tema?: string }>('area');
  const map = new Map<string, number>();
  for (const r of rows) {
    if (!r.area) continue;
    map.set(r.area, (map.get(r.area) || 0) + 1);
  }
  const itens: CatalogoItem[] = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([area, total]) => ({
      key: `materia:${slug(area)}`,
      label: area,
      sub: `${total} ${total === 1 ? 'tópico' : 'tópicos'} de resumo`,
      contexto: `Matéria jurídica brasileira: ${area}. Panorama geral dos institutos centrais da disciplina.`,
    }));
  areasCache = itens;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_AREAS_KEY, JSON.stringify(itens));
    }
  } catch {}
  return itens;
}

const normStr = (v?: string | null) =>
  (v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/** Tópicos (temas) de uma matéria, na ordem dos resumos. */
export async function fetchTemasResumos(area: string): Promise<TemaResumo[]> {
  const normAreaKey = normStr(area);
  const cache = temasCache.get(normAreaKey);
  if (cache) return cache;

  // 1. Tenta carregar do catálogo local (0ms)
  try {
    const catalog = await getResumosCatalog();
    const areaEncontrada = catalog.find((c) => normStr(c.area) === normAreaKey || normStr(c.area).includes(normAreaKey) || normAreaKey.includes(normStr(c.area)));
    if (areaEncontrada?.temas && areaEncontrada.temas.length > 0) {
      const lista = areaEncontrada.temas.map((t) => ({
        tema: t.tema,
        total: t.subtemas?.length || t.total || 1,
      }));
      temasCache.set(normAreaKey, lista);
      return lista;
    }
  } catch {}

  // 2. Fallback remoto
  const rows = await lerResumos<{ area: string; tema: string; ordem_tema: number | null }>(
    'area, tema, ordem_tema',
    (q) => q.ilike('area', area),
  );
  const map = new Map<string, { total: number; ordem: number }>();
  for (const r of rows) {
    if (normStr(r.area) !== normAreaKey || !r.tema) continue;
    const atual = map.get(r.tema);
    map.set(r.tema, {
      total: (atual?.total || 0) + 1,
      ordem: atual?.ordem ?? (r.ordem_tema ?? 9999),
    });
  }
  const lista = [...map.entries()]
    .sort((a, b) => a[1].ordem - b[1].ordem || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([tema, v]) => ({ tema, total: v.total }));
  if (lista.length === 0) {
    const { DESAFIOS_DECKS_CATALOGO } = await import('@/config/flashcardsDesafiosDecks');
    const areaInfo = DESAFIOS_DECKS_CATALOGO.find(
      (d) =>
        normStr(d.area) === normAreaKey ||
        normStr(d.slug) === normAreaKey ||
        normAreaKey.includes(normStr(d.slug)) ||
        normStr(d.area).includes(normAreaKey),
    );
    if (areaInfo?.decks?.length) {
      const fallbackList = areaInfo.decks.map((dk) => ({
        tema: dk.tema,
        total: dk.subtitulo ? dk.subtitulo.split(/,| e /i).length : 1,
      }));
      temasCache.set(normAreaKey, fallbackList);
      return fallbackList;
    }
  }

  temasCache.set(normAreaKey, lista);
  return lista;
}

export const slugTema = slug;

export interface SubtemaResumo {
  subtema: string;
  total: number;
}

const subtemasCache = new Map<string, SubtemaResumo[]>();

/** Subtemas de um tópico (tema) de uma matéria, na ordem dos resumos. */
export async function fetchSubtemasResumos(area: string, tema: string): Promise<SubtemaResumo[]> {
  const ck = `${normStr(area)}||${normStr(tema)}`;
  const cache = subtemasCache.get(ck);
  if (cache) return cache;

  // 1. Tenta carregar do catálogo local (0ms)
  try {
    const catalog = await getResumosCatalog();
    const areaEncontrada = catalog.find((c) => normStr(c.area) === normStr(area) || normStr(c.area).includes(normStr(area)) || normStr(area).includes(normStr(c.area)));
    const temaEncontrado = areaEncontrada?.temas?.find((t) => normStr(t.tema) === normStr(tema) || normStr(t.tema).includes(normStr(tema)) || normStr(tema).includes(normStr(t.tema)));
    if (temaEncontrado?.subtemas && temaEncontrado.subtemas.length > 0) {
      const lista = temaEncontrado.subtemas.map((s) => ({
        subtema: s.subtema,
        total: 1,
      }));
      subtemasCache.set(ck, lista);
      return lista;
    }
  } catch {}

  // 2. Fallback remoto
  const rows = await lerResumos<{ area: string; tema: string; subtema: string | null; ordem_subtema: number | null }>(
    'area, tema, subtema, ordem_subtema',
    (q) => q.ilike('area', area).ilike('tema', tema),
  );
  const map = new Map<string, { total: number; ordem: number }>();
  for (const r of rows) {
    if (normStr(r.area) !== normStr(area) || normStr(r.tema) !== normStr(tema)) continue;
    const nome = (r.subtema || '').trim();
    if (!nome) continue;
    const atual = map.get(nome);
    map.set(nome, {
      total: (atual?.total || 0) + 1,
      ordem: atual?.ordem ?? (r.ordem_subtema ?? 9999),
    });
  }
  const lista = [...map.entries()]
    .sort((a, b) => a[1].ordem - b[1].ordem || a[0].localeCompare(b[0], 'pt-BR'))
    .map(([subtema, v]) => ({ subtema, total: v.total }));

  if (lista.length === 0) {
    const normTemaKey = normStr(tema);
    const { DESAFIOS_DECKS_CATALOGO } = await import('@/config/flashcardsDesafiosDecks');
    const areaInfo = DESAFIOS_DECKS_CATALOGO.find(
      (d) =>
        normStr(d.area) === normStr(area) ||
        normStr(d.slug) === normStr(area) ||
        normStr(area).includes(normStr(d.slug)),
    );
    const deck = areaInfo?.decks?.find(
      (dk) => normStr(dk.tema) === normTemaKey || normTemaKey.includes(normStr(dk.tema)),
    );
    if (deck?.subtitulo) {
      const parts = deck.subtitulo
        .split(/,| e /i)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length > 0) {
        const fallbackSubtemas = parts.map((subtema) => ({
          subtema: subtema.charAt(0).toUpperCase() + subtema.slice(1),
          total: 1,
        }));
        subtemasCache.set(ck, fallbackSubtemas);
        return fallbackSubtemas;
      }
    }
  }

  subtemasCache.set(ck, lista);
  return lista;
}
