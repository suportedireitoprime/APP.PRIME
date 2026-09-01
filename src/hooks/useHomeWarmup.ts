import { useEffect } from 'react';
import { prefetchAllArtigos } from '@/services/legislacaoService';
import { prefetchResenha } from '@/services/atualizacaoService';
import { prefetchNoticias } from '@/services/noticiasService';
import { warmBiblioteca } from '@/services/bibliotecaWarmup';
import type { QueryClient } from '@tanstack/react-query';

export function useHomeWarmup(imagesToPreload: string[], queryClient?: QueryClient, isDesktop = false) {
  useEffect(() => {
    const ric: (cb: () => void) => number = (window as any).requestIdleCallback
      ? (cb) => (window as any).requestIdleCallback(cb, { timeout: isDesktop ? 2000 : 1500 })
      : (cb) => window.setTimeout(cb, isDesktop ? 500 : 300);

    const id = ric(() => {
      // 1. Prefetch Overlays and Heavy Components
      import('@/components/vademecum/SearchOverlay').catch(() => {});
      import('@/components/vademecum/AssistenteOverlayV2').catch(() => {});
      
      if (!isDesktop) {
        import('@/components/vademecum/SideMenu').catch(() => {});
        import('@/components/biblioteca/RecomendacoesCarousel').catch(() => {});
      }

      // 2. Preload Images
      imagesToPreload.forEach(src => {
        if (src) {
          const img = new Image();
          img.src = src;
        }
      });

      // 3. Prefetch Data
      prefetchResenha();
      prefetchNoticias();
      
      if (isDesktop) {
        prefetchAllArtigos(4);
        if (queryClient) {
          window.setTimeout(() => warmBiblioteca(queryClient), 600);
        }
      }
    });

    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (cic) cic(id); else window.clearTimeout(id);
    };
  }, [imagesToPreload, queryClient, isDesktop]);
}
