/**
 * offlineCoversSync.ts - Sincronizador Automático de Capas Offline no APP.PRIME
 * 
 * Implementa a Fase 19 do ecossistema de imagens (Item 98 do Relatório Master).
 * Pré-baixa e armazena no IndexedDB (idb-keyval) as capas de livros, clássicos e
 * códigos mais consultados, permitindo experiência de leitura 100% offline.
 */

import { fetchAndCacheImageOffline, hasImageOffline } from '@/services/imageOfflineStore';
import { Capacitor } from '@capacitor/core';

// Lista de capas essenciais de alta prioridade (Códigos, CF88 e clássicos)
export const CORE_OFFLINE_COVERS: string[] = [
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg',
];

interface SyncOptions {
  urls?: string[];
  batchSize?: number;
  onProgress?: (synced: number, total: number) => void;
}

let isSyncing = false;

/**
 * Executa a sincronização em segundo plano das capas prioritárias para operação offline.
 * Utiliza lotes pequenos e requestIdleCallback para impacto zero no frame-rate (120fps).
 */
export async function syncOfflineCovers(options: SyncOptions = {}): Promise<{ total: number; synced: number }> {
  if (typeof window === 'undefined' || isSyncing) {
    return { total: 0, synced: 0 };
  }

  // Respeita modo economia de dados do usuário
  // @ts-expect-error Connection API experimental
  if (navigator.connection && navigator.connection.saveData) {
    return { total: 0, synced: 0 };
  }

  // Verifica conectividade
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { total: 0, synced: 0 };
  }

  isSyncing = true;
  const targetUrls = Array.from(new Set([...(options.urls || []), ...CORE_OFFLINE_COVERS]));
  const batchSize = Math.max(1, options.batchSize || 2);
  let syncedCount = 0;

  try {
    for (let i = 0; i < targetUrls.length; i += batchSize) {
      const batch = targetUrls.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (url) => {
          try {
            const alreadyOffline = await hasImageOffline(url);
            if (!alreadyOffline) {
              await fetchAndCacheImageOffline(url);
            }
            syncedCount++;
          } catch {
            // Falha individual não interrompe as demais capas
          }
        })
      );

      options.onProgress?.(syncedCount, targetUrls.length);

      // Desacoplamento ocioso entre lotes
      await new Promise<void>((resolve) => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => resolve(), { timeout: 500 });
        } else {
          setTimeout(resolve, 150);
        }
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('prime:offline-covers-synced', {
          detail: { total: targetUrls.length, synced: syncedCount },
        })
      );
    }
  } finally {
    isSyncing = false;
  }

  return { total: targetUrls.length, synced: syncedCount };
}

/**
 * Inicializa a sincronização ociosa automática após a inicialização do app.
 */
export function scheduleIdleCoversSync(delayMs = 4000): void {
  if (typeof window === 'undefined') return;

  setTimeout(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        void syncOfflineCovers().catch(() => {});
      });
    } else {
      void syncOfflineCovers().catch(() => {});
    }
  }, delayMs);
}
