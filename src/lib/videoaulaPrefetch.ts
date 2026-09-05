import { supabase } from '@/integrations/supabase/client';
import { getAprenderCache, setAprenderCache } from '@/services/offlineDb';
import { ytThumb, type Catalogo } from '@/lib/videoaulasCatalogos';
import type { Aula } from '@/types/videoaula';

export interface VideoaulaBundle {
  aula: Aula;
  progresso?: { tempo_atual: number; concluida: boolean } | null;
  favorito?: boolean;
}

const memBundles = new Map<string, VideoaulaBundle>();
const inflight = new Map<string, Promise<VideoaulaBundle | null>>();

const bundleKey = (tabela: string, videoId: string) => `va:detail:${tabela}:${videoId}`;

export function preaquecerImagem(url?: string | null) {
  if (!url || typeof window === 'undefined') return;
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  } catch {
    /* noop */
  }
}

export function getCachedVideoaulaBundle(tabela: string, videoId: string): VideoaulaBundle | undefined {
  return memBundles.get(bundleKey(tabela, videoId));
}

export function setCachedVideoaulaBundle(tabela: string, videoId: string, bundle: VideoaulaBundle) {
  const key = bundleKey(tabela, videoId);
  memBundles.set(key, bundle);
  void setAprenderCache(key, 'aula', bundle).catch(() => {});
}

export async function fetchVideoaulaBundle(
  tabela: string,
  videoId: string,
  catalogo: Catalogo,
  userId: string | null,
): Promise<VideoaulaBundle | null> {
  const cols = `id, video_id, titulo, descricao, sobre_aula, duracao_segundos, ${catalogo.thumbCol}${
    catalogo.temAreas ? ', area' : ''
  }`;

  const [aulaRes, progRes, favRes] = await Promise.all([
    supabase.from(tabela as any).select(cols).eq('video_id', videoId).maybeSingle(),
    userId
      ? supabase
          .from('videoaulas_progresso')
          .select('tempo_atual, concluida')
          .eq('user_id', userId)
          .eq('tabela', tabela)
          .eq('video_id', videoId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    userId
      ? supabase
          .from('videoaulas_favoritos')
          .select('id')
          .eq('user_id', userId)
          .eq('tabela', tabela)
          .eq('video_id', videoId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (aulaRes.error || !aulaRes.data) return null;

  const aula = aulaRes.data as Aula;
  const bundle: VideoaulaBundle = {
    aula,
    progresso: progRes?.data
      ? {
          tempo_atual: Number(progRes.data.tempo_atual) || 0,
          concluida: !!progRes.data.concluida,
        }
      : null,
    favorito: !!favRes?.data,
  };

  setCachedVideoaulaBundle(tabela, videoId, bundle);

  // Pre-aquecer thumbnail no cache do navegador
  const thumbUrl = aula.thumb ?? aula.thumbnail ?? ytThumb(videoId, 'mq');
  preaquecerImagem(thumbUrl);

  return bundle;
}

export async function prefetchVideoaulaDetail(
  tabela: string,
  videoId: string,
  catalogo: Catalogo,
  userId: string | null,
): Promise<VideoaulaBundle | null> {
  if (!tabela || !videoId) return null;

  const key = bundleKey(tabela, videoId);
  const mem = memBundles.get(key);
  if (mem) return mem;

  const flying = inflight.get(key);
  if (flying) return flying;

  const p = (async () => {
    // 1. Tenta IndexedDB local
    const persisted = await getAprenderCache<VideoaulaBundle>(key);
    if (persisted?.aula) {
      memBundles.set(key, persisted);
      const thumbUrl = persisted.aula.thumb ?? persisted.aula.thumbnail ?? ytThumb(videoId, 'mq');
      preaquecerImagem(thumbUrl);
      return persisted;
    }

    // 2. Busca do Supabase
    return fetchVideoaulaBundle(tabela, videoId, catalogo, userId);
  })();

  inflight.set(key, p);
  p.finally(() => inflight.delete(key));
  return p;
}

/**
 * Pré-carrega as próximas aulas de uma área/trilha para transição instantânea (0ms)
 */
export function prefetchProximasAulas(
  aulas: Array<{ video_id: string; thumb?: string | null; thumbnail?: string | null }>,
  currentVideoId: string,
  catalogo: Catalogo,
  userId: string | null,
  count = 2,
) {
  if (!aulas.length || !currentVideoId || !catalogo) return;

  const currentIdx = aulas.findIndex((a) => a.video_id === currentVideoId);
  if (currentIdx === -1) return;

  const proximas = aulas.slice(currentIdx + 1, currentIdx + 1 + count);

  proximas.forEach((prox, idx) => {
    if (!prox.video_id) return;
    // Pré-carrega imagem imediatamente
    preaquecerImagem(prox.thumb ?? prox.thumbnail ?? ytThumb(prox.video_id, 'mq'));

    // Escalonamento em idle para prefetch dos metadados
    const delay = (idx + 1) * 350;
    setTimeout(() => {
      void prefetchVideoaulaDetail(catalogo.tabela, prox.video_id, catalogo, userId);
    }, delay);
  });
}
