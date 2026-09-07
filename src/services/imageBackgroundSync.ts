/**
 * imageBackgroundSync.ts — Fase 59 de Otimização de Imagens
 * 
 * Pré-aquecimento e sincronização em segundo plano (Background Sync) de capas essenciais e notícias,
 * executado estritamente em momentos ociosos (requestIdleCallback) para garantir 0-lag na navegação.
 */
import { syncEssentialCoversOffline } from './imageOfflineStore';
import { supabase } from '@/integrations/supabase/client';

let syncStarted = false;

/**
 * Inicia o agendamento de pré-aquecimento de capas em segundo plano.
 * Respeita economia de dados (Save-Data) e estado de conexão.
 */
export function scheduleBackgroundImageWarmup(): void {
  if (syncStarted || typeof window === 'undefined') return;
  syncStarted = true;

  // Aguarda 4 segundos após o carregamento inicial da UI para não disputar banda com o LCP
  setTimeout(() => {
    const runWarmup = async () => {
      // 1. Checa economia de dados
      if (typeof navigator !== 'undefined') {
        if (!navigator.onLine) return;
        // @ts-expect-error NetworkInformation API experimental
        if (navigator.connection?.saveData === true) return;
        // @ts-expect-error NetworkInformation API experimental
        const connType = navigator.connection?.effectiveType;
        if (connType === 'slow-2g' || connType === '2g') return;
      }

      try {
        // 2. Busca URLs de capas de obras mais recentes ou em destaque
        const { data: livros } = await supabase
          .from('livros')
          .select('capa')
          .not('capa', 'is', null)
          .limit(12);

        if (livros && livros.length > 0) {
          const urls = livros
            .map((l: { capa: string | null }) => l.capa)
            .filter((url: string | null): url is string => Boolean(url && url.startsWith('http')));

          if (urls.length > 0) {
            await syncEssentialCoversOffline(urls);
          }
        }
      } catch {
        // Falha silenciosa em background
      }
    };

    if ('requestIdleCallback' in window) {
      // @ts-expect-error requestIdleCallback compat
      window.requestIdleCallback(() => void runWarmup(), { timeout: 3000 });
    } else {
      setTimeout(() => void runWarmup(), 1000);
    }
  }, 4000);
}
