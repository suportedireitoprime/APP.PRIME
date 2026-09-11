// Prefetch de dados de uma aula específica com SWR persistente (IndexedDB).
import { supabase } from '@/integrations/supabase/client';
import { prefetchRoute } from './routePrefetch';
import { getAprenderCache, setAprenderCache } from '@/services/offlineDb';
import { interleaveBlocos } from './aprenderUtils';
import { get as idbGet, set as idbSet } from 'idb-keyval';

type AulaBundle = {
  aula: any;
  blocos: any[];
  proximaAula?: any;
  proximasAulas?: any[];
};

const memCache = new Map<string, AulaBundle>();
const inflight = new Map<string, Promise<AulaBundle>>();

const keyFor = (aulaId: string) => `aula:${aulaId}`;

export function getCachedAprenderAula(aulaId: string): AulaBundle | undefined {
  return memCache.get(aulaId);
}

async function fetchFromNetwork(aulaId: string): Promise<AulaBundle> {
  const [{ data: a }, { data: bs }] = await Promise.all([
    supabase.from('aprender_aulas')
      .select('id, titulo, objetivo, duracao_est_min, previa, modulo_id, ordem')
      .eq('id', aulaId).maybeSingle(),
    supabase.from('aprender_blocos')
      .select('id, ordem, tipo, payload, resposta_correta')
      .eq('aula_id', aulaId).order('ordem'),
  ]);
  
  let proxLista: any[] = [];
  let proxItem: any = null;
  if (a?.modulo_id != null) {
    const { data: prox } = await supabase
      .from('aprender_aulas')
      .select('id, titulo, ordem')
      .eq('modulo_id', a.modulo_id)
      .gt('ordem', a?.ordem ?? 0)
      .order('ordem')
      .limit(8);
    proxLista = (prox ?? []).map((p: any) => ({ id: p.id, titulo: p.titulo }));
    proxItem = proxLista[0] ?? null;
  }

  const finalBlocos = interleaveBlocos((bs ?? []) as any[]);
  const bundle = { aula: a, blocos: finalBlocos, proximaAula: proxItem, proximasAulas: proxLista };
  
  // Pré-carrega imagens em background (0ms delay UI)
  if (typeof window !== 'undefined') {
    finalBlocos.forEach(b => {
      const imgUrl = b.payload?.imageUrl || b.payload?.imagemUrl || b.payload?.url;
      if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
        const img = new Image();
        img.src = imgUrl;
      }
    });
  }

  // Sincroniza também com o idb-keyval usado nativamente pelo useAprenderAula
  await idbSet(`aprender_aula_cache_${aulaId}`, bundle).catch(() => {});
  
  return bundle;
}

function revalidate(aulaId: string) {
  const key = keyFor(aulaId);
  if (inflight.has(aulaId)) return;
  const p = (async () => {
    try {
      const fresh = await fetchFromNetwork(aulaId);
      memCache.set(aulaId, fresh);
      await setAprenderCache(key, 'aula', fresh);
      return fresh;
    } finally {
      inflight.delete(aulaId);
    }
  })();
  inflight.set(aulaId, p);
}

export function prefetchAprenderAula(aulaId: string): Promise<AulaBundle> {
  if (!aulaId) return Promise.resolve({ aula: null, blocos: [] });
  try { prefetchRoute('aprenderAula'); } catch { /* noop */ }

  const mem = memCache.get(aulaId);
  if (mem) { revalidate(aulaId); return Promise.resolve(mem); }

  const flying = inflight.get(aulaId);
  if (flying) return flying;

  const p = (async () => {
    // Tenta IndexedDB primeiro
    const persisted = await getAprenderCache<AulaBundle>(keyFor(aulaId));
    if (persisted) {
      memCache.set(aulaId, persisted);
      revalidate(aulaId);
      return persisted;
    }
    const fresh = await fetchFromNetwork(aulaId);
    memCache.set(aulaId, fresh);
    setAprenderCache(keyFor(aulaId), 'aula', fresh);
    return fresh;
  })();
  inflight.set(aulaId, p);
  p.finally(() => inflight.delete(aulaId));
  p.catch(() => memCache.delete(aulaId));
  return p;
}
