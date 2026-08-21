import { resenhaSelect, RESENHA_SELECT } from '@/lib/resenhaBackend';

export interface ResenhaItem {
  id: string;
  tipo_ato: string;
  numero_ato: string;
  ementa: string;
  url: string;
  texto_completo: string | null;
  explicacao: string | null;
  data_publicacao: string;
  data_dou: string;
  created_at: string;
}

let resenhaCache: ResenhaItem[] | null = null;
let fetchPromise: Promise<void> | null = null;

export function getResenhaCache(): ResenhaItem[] | null {
  return resenhaCache;
}

export function getLatestDayCount(): number {
  if (!resenhaCache || resenhaCache.length === 0) return 0;
  const dates = resenhaCache.map(i => (i.data_dou || i.data_publicacao || '').slice(0, 10)).filter(Boolean);
  if (dates.length === 0) return 0;
  const latest = dates.sort().reverse()[0];
  return resenhaCache.filter(i => (i.data_dou || i.data_publicacao || '').slice(0, 10) === latest).length;
}

export function getLatestDate(): Date | null {
  if (!resenhaCache || resenhaCache.length === 0) return null;
  const dates = resenhaCache.map(i => (i.data_dou || i.data_publicacao || '').slice(0, 10)).filter(Boolean);
  if (dates.length === 0) return null;
  const latest = dates.sort().reverse()[0];
  const [y, m, d] = latest.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export async function prefetchResenha(): Promise<void> {
  if (resenhaCache) return;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    // Traz já com texto_completo/explicacao para abertura instantânea.
    const data = await resenhaSelect<ResenhaItem>({
      select: RESENHA_SELECT,
      order: 'data_dou.desc',
      limit: '200',
    });

    if (data.length) {
      resenhaCache = data;
    }
    fetchPromise = null;
  })();

  return fetchPromise;
}
