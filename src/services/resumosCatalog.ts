import coverCpArtigos from '@/assets/covers/cp_artigos_v2.webp';

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

let memoryCatalog: AreaItem[] | null = null;

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

  // 1. Procura direta por ID único (ex: direito-administrativo_administracao-publica_cap1)
  if (subtemaOrId) {
    for (const a of catalog) {
      for (const t of a.temas) {
        for (const s of t.subtemas) {
          if (s.id === subtemaOrId) return s;
        }
      }
    }
  }

  // 2. Procura pela área e tema correspondentes
  if (area && tema && subtemaOrId) {
    const areaObj = matchAreaInCatalog(catalog, area);
    if (areaObj) {
      const temaObj = matchTemaInArea(areaObj.temas, tema);
      if (temaObj) {
        const cleanSub = cleanResumoString(subtemaOrId);
        return (
          temaObj.subtemas.find((s) => cleanResumoString(s.subtema) === cleanSub) ||
          temaObj.subtemas.find((s) => {
            const sn = cleanResumoString(s.subtema);
            return sn.includes(cleanSub) || cleanSub.includes(sn);
          })
        );
      }
    }
  }

  return undefined;
}

