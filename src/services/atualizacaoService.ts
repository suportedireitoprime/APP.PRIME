import { resenhaSelect, RESENHA_LIST_SELECT } from '@/lib/resenhaBackend';
import { getListSnapshot, setListSnapshot } from '@/services/offlineDb';

export interface ResenhaItem {
  id: string;
  tipo_ato: string;
  numero_ato: string;
  ementa: string;
  url: string;
  texto_completo?: string | null;
  explicacao?: string | null;
  data_publicacao: string;
  data_dou: string;
  created_at: string;
}

let resenhaCache: ResenhaItem[] | null = null;
let fetchPromise: Promise<void> | null = null;

export function getResenhaCache(): ResenhaItem[] | null {
  return resenhaCache;
}

export async function getResenhaOfflineOrCache(): Promise<ResenhaItem[] | null> {
  if (resenhaCache && resenhaCache.length > 0) return resenhaCache;
  try {
    const offlineItems = await getListSnapshot<ResenhaItem>('radar-360:resenha');
    if (offlineItems && offlineItems.length > 0) {
      resenhaCache = offlineItems;
      return offlineItems;
    }
  } catch { /* ignore */ }
  return null;
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
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    // 1) Hidrata do cache offline IndexedDB se a memória estiver vazia
    if (!resenhaCache || resenhaCache.length === 0) {
      try {
        const offlineItems = await getListSnapshot<ResenhaItem>('radar-360:resenha');
        if (offlineItems && offlineItems.length > 0) {
          resenhaCache = offlineItems;
        }
      } catch { /* offline read ignore */ }
    }

    // 2) Se estiver sem conexão, mantém o que já carregou do IndexedDB
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      fetchPromise = null;
      return;
    }

    try {
      // 3) Revalida pela rede online com payload enxuto
      const data = await resenhaSelect<ResenhaItem>({
        select: RESENHA_LIST_SELECT,
        order: 'data_dou.desc',
        limit: '150',
      });

      if (data && data.length) {
        resenhaCache = data;
        // Persiste no IndexedDB para uso offline instantâneo
        setListSnapshot('radar-360:resenha', data).catch(() => {});
      }
    } catch (e) {
      console.warn('[resenha] Erro no prefetchResenha:', e);
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}
