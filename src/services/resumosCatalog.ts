import coverCpArtigos from '@/assets/covers/cp_artigos_v2.webp';
import { get as idbGet, set as idbSet } from 'idb-keyval';

export interface SubtemaItem {
  id: string;
  subtema: string;
  ordem?: number;
  markdown?: string;
  exemplos?: string;
  termos?: string;
  audio_url?: string | null;
  imageUrl?: string | null;
}

export interface TemaItem {
  tema: string;
  total: number;
  subtemas: SubtemaItem[];
}

export interface AreaItem {
  area: string;
  total: number;
  coverUrl: string;
  temas: TemaItem[];
}

export const R2_RESUMOS_BASE_URL = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/resumos';

export function slugifyAreaForR2(raw?: string | null): string {
  const s = (raw || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (s.includes('filoso') || s.includes('teoria')) return 'teoria-e-filosofia-do-direito';
  if (s.includes('portug')) return 'portugues';
  if (s.includes('internac')) return 'direito-internacional-privado';
  if (s.includes('admin')) return 'direito-administrativo';
  if (s.includes('civil') && s.includes('process')) return 'direito-processual-civil';
  if (s.includes('penal') && s.includes('process')) return 'direito-processual-penal';
  if (s.includes('trab') && s.includes('process')) return 'direito-processual-do-trabalho';
  if (s.includes('lei-penal') || s.includes('legislacao-penal')) return 'lei-penal-especial';
  if (s.includes('penal')) return 'direito-penal';
  if (s.includes('const')) return 'direito-constitucional';
  if (s.includes('trab')) return 'direito-do-trabalho';
  if (s.includes('civil')) return 'direito-civil';
  if (s.includes('tribut')) return 'direito-tributario';
  if (s.includes('empres')) return 'direito-empresarial';
  if (s.includes('ambien')) return 'direito-ambiental';
  if (s.includes('previd')) return 'direito-previdenciario';
  if (s.includes('finan')) return 'direito-financeiro';
  if (s.includes('urban')) return 'direito-urbanistico';
  if (s.includes('human')) return 'direitos-humanos';
  if (s.includes('desport')) return 'direito-desportivo';
  if (s.includes('politic')) return 'politicas-publicas';
  if (s.includes('complem') || s.includes('formacao')) return 'formacao-complementar';

  return s;
}

let memoryCatalog: AreaItem[] | null = null;
const materiaMemoryCache = new Map<string, AreaItem>();
const inflightMateriaRequests = new Map<string, Promise<AreaItem | null>>();

export async function getResumosCatalog(): Promise<AreaItem[]> {
  if (memoryCatalog && memoryCatalog.length > 0) return memoryCatalog;

  try {
    const res = await fetch('/offline-bundle/resumos-catalog.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        memoryCatalog = data;
        return data;
      }
    }
  } catch {}

  return [];
}

/**
 * Carrega o conteúdo completo com Markdown de uma matéria inteira do Cloudflare R2
 * com estratégia de 3 camadas: Memória (0ms) -> IndexedDB (0ms) -> Cloudflare R2 (<200ms).
 */
export async function getOrFetchMateriaContent(areaName: string): Promise<AreaItem | null> {
  if (!areaName) return null;
  const slug = slugifyAreaForR2(areaName);

  // 1. Memória Síncrona (0ms)
  if (materiaMemoryCache.has(slug)) {
    return materiaMemoryCache.get(slug)!;
  }

  // Deduplicação de requisições em voo
  if (inflightMateriaRequests.has(slug)) {
    return inflightMateriaRequests.get(slug)!;
  }

  const p = (async (): Promise<AreaItem | null> => {
    // 2. Cache persistente no IndexedDB (idb-keyval)
    const idbKey = `resumo_materia_r2_v1:${slug}`;
    try {
      const cached = await idbGet<AreaItem>(idbKey);
      if (cached && cached.temas && cached.temas.length > 0) {
        materiaMemoryCache.set(slug, cached);
        mergeIntoMemoryCatalog(cached);
        return cached;
      }
    } catch {}

    // 3. Download direto do Cloudflare R2
    try {
      const r2Url = `${R2_RESUMOS_BASE_URL}/materias/${slug}.json`;
      const res = await fetch(r2Url);
      if (res.ok) {
        const fullData: AreaItem = await res.json();
        if (fullData && fullData.temas) {
          materiaMemoryCache.set(slug, fullData);
          mergeIntoMemoryCatalog(fullData);
          // Persiste em IndexedDB em background
          void idbSet(idbKey, fullData).catch(() => {});
          return fullData;
        }
      }
    } catch (err) {
      console.warn(`[resumosCatalog] Falha ao baixar matéria ${slug} do R2:`, err);
    }

    return null;
  })();

  inflightMateriaRequests.set(slug, p);
  try {
    return await p;
  } finally {
    inflightMateriaRequests.delete(slug);
  }
}

/**
 * Mescla os dados completos com markdown no catálogo em memória para buscas instantâneas
 */
function mergeIntoMemoryCatalog(fullArea: AreaItem) {
  if (!memoryCatalog) return;
  const idx = memoryCatalog.findIndex((a) => cleanResumoString(a.area) === cleanResumoString(fullArea.area));
  if (idx >= 0) {
    memoryCatalog[idx] = fullArea;
  } else {
    memoryCatalog.push(fullArea);
  }
}

/**
 * Obtém ou faz download sob demanda do subtema com Markdown completo e Áudio do R2
 */
export async function getOrFetchSubtemaContent(
  area?: string | null,
  tema?: string | null,
  subtemaOrId?: string | null
): Promise<SubtemaItem | null> {
  if (!area) return null;

  // 1. Tenta pegar do catálogo em memória se já tiver markdown
  if (memoryCatalog) {
    const existing = findSubtemaInCatalog(memoryCatalog, area, tema, subtemaOrId);
    if (existing && existing.markdown && existing.markdown.trim().length > 0) {
      return existing;
    }
  }

  // 2. Busca o conteúdo completo da matéria no Cloudflare R2
  const fullArea = await getOrFetchMateriaContent(area);
  if (fullArea && Array.isArray(fullArea.temas)) {
    // 2.1 Se tiver identificador oficial _cap, busca diretamente em todos os temas
    if (subtemaOrId && String(subtemaOrId).includes('_cap')) {
      for (const t of fullArea.temas) {
        const foundById = t.subtemas?.find((s) => s.id === subtemaOrId);
        if (foundById && foundById.markdown && foundById.markdown.trim().length > 0) {
          return foundById;
        }
      }
    }

    const temaObj = matchTemaInArea(fullArea.temas, tema || '');
    if (temaObj && temaObj.subtemas && temaObj.subtemas.length > 0) {
      if (subtemaOrId) {
        const cleanTarget = cleanResumoString(subtemaOrId);
        const match =
          temaObj.subtemas.find((s) => cleanResumoString(s.subtema) === cleanTarget) ||
          temaObj.subtemas.find((s) => cleanResumoString(s.id) === cleanTarget) ||
          temaObj.subtemas.find((s) => {
            const sn = cleanResumoString(s.subtema);
            return sn.includes(cleanTarget) || cleanTarget.includes(sn);
          });

        if (match) return match;
      }

      return temaObj.subtemas[0];
    }
  }

  return null;
}

export function cleanResumoString(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^direito\s+/i, '')
    .replace(/^processo\s+/i, 'processual ')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function matchAreaInCatalog(catalog: AreaItem[], targetArea: string): AreaItem | undefined {
  if (!targetArea) return undefined;
  const t = cleanResumoString(targetArea);
  if (!t) return undefined;

  return (
    catalog.find((c) => cleanResumoString(c.area) === t) ||
    catalog.find((c) => {
      const cNorm = cleanResumoString(c.area);
      return cNorm.includes(t) || t.includes(cNorm);
    })
  );
}

export function matchTemaInArea(temas: TemaItem[], targetTema: string): TemaItem | undefined {
  if (!targetTema || !Array.isArray(temas)) return undefined;
  const t = cleanResumoString(targetTema);
  if (!t) return undefined;

  return (
    temas.find((item) => cleanResumoString(item.tema) === t) ||
    temas.find((item) => {
      const itemNorm = cleanResumoString(item.tema);
      return itemNorm.includes(t) || t.includes(itemNorm);
    })
  );
}

export function findSubtemaInCatalog(
  catalog: AreaItem[],
  area?: string | null,
  tema?: string | null,
  subtemaOrId?: string | null
): SubtemaItem | undefined {
  if (!catalog || !Array.isArray(catalog)) return undefined;

  // 1. Procura direta por ID único oficial (ex: direito-administrativo_administracao-publica_cap1)
  if (subtemaOrId && String(subtemaOrId).includes('_cap')) {
    for (const a of catalog) {
      for (const t of a.temas) {
        for (const s of t.subtemas) {
          if (s.id === subtemaOrId) return s;
        }
      }
    }
  }

  // 2. Procura pela área e tema correspondentes
  if (area && tema) {
    const areaObj = matchAreaInCatalog(catalog, area);
    if (areaObj) {
      const temaObj = matchTemaInArea(areaObj.temas, tema);
      if (temaObj && temaObj.subtemas && temaObj.subtemas.length > 0) {
        // Se subtemaOrId não foi informado, for igual ao tema ou for um UUID legado do Supabase
        const isLegacyOrEqual =
          !subtemaOrId ||
          !String(subtemaOrId).includes('_cap') && (
            cleanResumoString(subtemaOrId) === cleanResumoString(tema) ||
            cleanResumoString(subtemaOrId).length > 25
          );

        if (isLegacyOrEqual) {
          return temaObj.subtemas[0];
        }

        const cleanSub = cleanResumoString(subtemaOrId);
        const match =
          temaObj.subtemas.find((s) => cleanResumoString(s.subtema) === cleanSub) ||
          temaObj.subtemas.find((s) => {
            const sn = cleanResumoString(s.subtema);
            return sn.includes(cleanSub) || cleanSub.includes(sn);
          });

        return match || temaObj.subtemas[0];
      }
    }
  }

  return undefined;
}

