import { useEffect } from 'react';
import { prefetchAllArtigos } from '@/services/legislacaoService';
import { prefetchResenha } from '@/services/atualizacaoService';
import { prefetchNoticias } from '@/services/noticiasService';
import { warmBiblioteca } from '@/services/bibliotecaWarmup';
import type { QueryClient } from '@tanstack/react-query';

export function useHomeWarmup(imagesToPreload: string[], queryClient?: QueryClient, isDesktop = false) {
  useEffect(() => {
    // ⚡ LATÊNCIA ZERO: No mobile, aguarda 6s após a Home estar visível para rodar prefetch
    const delayWarmup = isDesktop ? 1500 : 6000;
    const timer = setTimeout(() => {
      const ric: (cb: () => void) => number = (window as any).requestIdleCallback
        ? (cb) => (window as any).requestIdleCallback(cb, { timeout: 3000 })
        : (cb) => window.setTimeout(cb, 500);

      ric(() => {
        // 1. Prefetch Overlays and Heavy Components
        import('@/components/vademecum/overlays/SearchOverlay').catch(() => {});
        import('@/components/vademecum/overlays/AssistenteOverlay').catch(() => {});
        import('@/pages/vademecum/VadeMecum').catch(() => {});
        
        if (!isDesktop) {
          import('@/components/vademecum/navigation/SideMenu').catch(() => {});
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
    }, delayWarmup);

    return () => clearTimeout(timer);
  }, [imagesToPreload, queryClient, isDesktop]);
}
