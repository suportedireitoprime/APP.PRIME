import { getOfflinePackage } from './downloadManager';

const cache = new Map<string, unknown[]>();
const inflight = new Map<string, Promise<unknown[]>>();

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && (window as any).desktopApp?.isElectron === true;
}

async function fetchBundle<T>(name: string): Promise<T[]> {
  if (cache.has(name)) return cache.get(name) as T[];
  if (inflight.has(name)) return (await inflight.get(name)!) as T[];
  
  const p = (async () => {
    try {
      // 1. Tentar pegar do armazenamento offline local (IndexedDB via idb-keyval)
      const localData = await getOfflinePackage<T>(name);
      if (localData && localData.length > 0) {
        cache.set(name, localData);
        return localData;
      }

      // 2. Fallback: Baixar diretamente da nuvem (Supabase CDN)
      // Como removemos os JSONs do bundle para economizar espaço (Slim Down),
      // eles não estão mais em /offline-bundle/.
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/offline-bundles/${name}.json`, { cache: 'force-cache' });
      if (!res.ok) return [];
      
      const data = (await res.json()) as unknown[];
      cache.set(name, data);
      return data;
    } catch {
      return [];
    } finally {
      inflight.delete(name);
    }
  })();
  
  inflight.set(name, p);
  return (await p) as T[];
}

export const bundle = {
  resumos: <T = any>() => fetchBundle<T>('resumos'),
  blogPosts: <T = any>() => fetchBundle<T>('blog-posts'),
  noticias: <T = any>() => fetchBundle<T>('noticias'),
  tematicaObras: <T = any>() => fetchBundle<T>('tematica-obras'),
  bibliotecaClassicos: <T = any>() => fetchBundle<T>('biblioteca-classicos'),
  bibliotecaOab: <T = any>() => fetchBundle<T>('biblioteca-oab'),
  bibliotecaEstudos: <T = any>() => fetchBundle<T>('biblioteca-estudos'),
  bibliotecaPortugues: <T = any>() => fetchBundle<T>('biblioteca-portugues'),
  bibliotecaLideranca: <T = any>() => fetchBundle<T>('biblioteca-lideranca'),
  bibliotecaForaDaToga: <T = any>() => fetchBundle<T>('biblioteca-fora-da-toga'),
  bibliotecaPesquisaCientifica: <T = any>() => fetchBundle<T>('biblioteca-pesquisa-cientifica'),
  questoesAreas: <T = any>() => fetchBundle<T>('questoes-areas'),
  flashcardsResumoAreas: <T = any>() => fetchBundle<T>('flashcards-resumo-areas'),
  flashcardsCardsPorArea: <T = any>(area: string) => {
    const safeName = area.replace(/[^a-zA-Z0-9_-]/g, '_');
    return fetchBundle<T>(`flashcards-cards_${safeName}`);
  },
  flashcardsDecks: <T = any>() => fetchBundle<T>('flashcards-decks'),
  questoesPorDisciplina: <T = any>(disciplina: string) => {
    const safeName = disciplina.replace(/[^a-zA-Z0-9_-]/g, '_');
    return fetchBundle<T>(`questoes_${safeName}`);
  },
};

/**
 * Se a query online falhou ou veio vazia, cai no bundle.
 * Ideal pra páginas de leitura: nunca mostra tela vazia.
 */
export async function withBundleFallback<T>(
  online: Promise<T[] | null | undefined>,
  loader: () => Promise<T[]>,
): Promise<T[]> {
  try {
    const data = await online;
    if (data && data.length > 0) return data;
  } catch {}
  return await loader();
}
