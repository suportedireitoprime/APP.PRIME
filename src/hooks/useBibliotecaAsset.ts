import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getLocalCoverUrl } from '@/services/bibliotecaCapasPrefetch';
import { directImg } from '@/lib/cdnImg';

// Cache in-memory do manifest de capas nativas exportadas
let offlineCoversManifest: Record<string, string> | null = null;
let manifestPromise: Promise<void> | null = null;

async function getOfflineCover(remoteUrl: string): Promise<string | null> {
  if (!offlineCoversManifest) {
    if (!manifestPromise) {
      manifestPromise = fetch('/offline-covers/manifest.json')
        .then(res => res.json())
        .then(data => { offlineCoversManifest = data; })
        .catch(() => { offlineCoversManifest = {}; });
    }
    await manifestPromise;
  }
  const filename = offlineCoversManifest?.[remoteUrl];
  if (filename) return `/offline-covers/${filename}`;
  return null;
}

// Cache síncrono em memória de capas já resolvidas para evitar recarregamento/piscar (Item 46)
const resolvedCoversCache = new Map<string, string>();

/**
 * Retorna URL local (filesystem ou bundle) da capa se já baixada em nativo,
 * ou a URL CDN otimizada em web/desktop.
 * Utiliza cache síncrono em memória para renderização imediata (0ms) sem flashes.
 */
export function useBibliotecaCapa(remoteUrl: string | null | undefined, width = 300): string {
  const cdn = remoteUrl ? directImg(remoteUrl, width) : '';
  const cached = remoteUrl ? resolvedCoversCache.get(remoteUrl) || null : null;
  const [local, setLocal] = useState<string | null>(cached);

  useEffect(() => {
    let cancelled = false;
    if (!remoteUrl) { setLocal(null); return; }
    
    // Se já estiver no cache em memória, não precisa buscar novamente
    if (resolvedCoversCache.has(remoteUrl)) {
      setLocal(resolvedCoversCache.get(remoteUrl)!);
      return;
    }

    (async () => {
      // 1. Tenta carregar do bundle offline nativo (se exportado pelo script)
      const bundled = await getOfflineCover(remoteUrl);
      if (bundled) {
        resolvedCoversCache.set(remoteUrl, bundled);
        if (!cancelled) setLocal(bundled);
        return;
      }
      
      // 2. Tenta carregar do cache dinâmico do Capacitor
      if (Capacitor.isNativePlatform()) {
        const url = await getLocalCoverUrl(remoteUrl);
        if (url) {
          resolvedCoversCache.set(remoteUrl, url);
          if (!cancelled) setLocal(url);
          return;
        }
      }

      // Pré-carrega na memória do navegador para o paint seguinte ser instantâneo
      if (cdn && typeof window !== 'undefined') {
        const img = new Image();
        img.src = cdn;
        resolvedCoversCache.set(remoteUrl, cdn);
      }
    })();
    return () => { cancelled = true; };
  }, [remoteUrl, cdn]);

  return local || cached || cdn;
}
