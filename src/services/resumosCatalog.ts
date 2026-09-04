export interface SubtemaItem {
  id: string;
  subtema: string;
  ordem?: number;
  markdown?: string;
  exemplos?: string;
  termos?: string;
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

  // Fallback: localStorage
  try {
    const stored = localStorage.getItem('resumos_areas_temas_cache');
    if (stored) {
      const parsed = JSON.parse(stored) as Array<{ area: string; total?: number; temas?: Array<string | TemaItem> }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const fallback: AreaItem[] = parsed.map((p) => ({
          area: p.area,
          total: p.total || (p.temas?.length || 0),
          coverUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg',
          temas: (p.temas || []).map((t) => typeof t === 'string' ? { tema: t, total: 1, subtemas: [] } : t)
        }));
        memoryCatalog = fallback;
        return fallback;
      }
    }
  } catch {}

  return [];
}
