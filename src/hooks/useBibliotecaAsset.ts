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

/**
 * Retorna URL local (filesystem ou bundle) da capa se já baixada em nativo,
 * ou a URL CDN otimizada em web/desktop.
 */
export function useBibliotecaCapa(remoteUrl: string | null | undefined, width = 300): string {
  const cdn = remoteUrl ? directImg(remoteUrl, width) : '';
  const [local, setLocal] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!remoteUrl) { setLocal(null); return; }
    
    (async () => {
      // 1. Tenta carregar do bundle offline nativo (se exportado pelo script)
      const bundled = await getOfflineCover(remoteUrl);
      if (bundled) {
        if (!cancelled) setLocal(bundled);
        return;
      }
      
      // 2. Tenta carregar do cache dinâmico do Capacitor
      if (Capacitor.isNativePlatform()) {
        const url = await getLocalCoverUrl(remoteUrl);
        if (url && !cancelled) setLocal(url);
      }
    })();
    return () => { cancelled = true; };
  }, [remoteUrl]);

  return local || cdn;
}
