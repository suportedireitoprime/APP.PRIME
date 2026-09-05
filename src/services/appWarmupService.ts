/**
 * Coordenador Geral de Cache Aquecido e Prefetch do Aplicativo.
 *
 * Garante que Biblioteca, Resumos, Videoaulas e Vade Mecum estejam
 * 100% aquecidos em memória (RAM), IndexedDB e cache de módulos
 * logo após o boot da aplicação, permitindo abertura instantânea (0ms).
 */
import type { QueryClient } from '@tanstack/react-query';
import { scheduleWarmBiblioteca } from '@/services/bibliotecaWarmup';
import { warmResumosCache } from '@/services/resumosWarmup';
import { warmVideoaulasStartup } from '@/services/videoaulasWarmup';
import { prewarmFavoritosERecentesIdle } from '@/services/warmFavoritosService';
import { routePrefetch } from '@/lib/routePrefetch';
import brasaoImg from '@/assets/brasao-republica.webp';

let appWarmupStarted = false;

export function scheduleAppWarmup(qc: QueryClient): void {
  if (appWarmupStarted || typeof window === 'undefined') return;
  appWarmupStarted = true;

  const runWarmup = () => {
    try {
      // 1. Aquece Biblioteca (IndexedDB + QueryClient + capas)
      scheduleWarmBiblioteca(qc, 50);

      // 2. Aquece Resumos Jurídicos (localStorage + offlineBundle + rede em background)
      void warmResumosCache();

      // 3. Aquece Videoaulas (IndexedDB + catálogos + progresso + agregador síncrono)
      warmVideoaulasStartup();

      // 4. Aquece Vade Mecum (favoritos, recentes e imagem do brasão)
      prewarmFavoritosERecentesIdle();
      try {
        const img = new Image();
        img.decoding = 'async';
        (img as any).fetchPriority = 'high';
        img.src = brasaoImg;
      } catch {
        /* noop */
      }

      // 5. Pre-carrega os chunks das 4 rotas prioritárias no cache de módulos do navegador
      const prefetchKeyRoutes = () => {
        try { routePrefetch.vadeMecum(); } catch {}
        try { routePrefetch.biblioteca(); } catch {}
        try { routePrefetch.resumosJuridicos(); } catch {}
        try { routePrefetch.videoaulas(); } catch {}
      };

      const ric = (window as any).requestIdleCallback;
      if (ric) {
        ric(prefetchKeyRoutes, { timeout: 2000 });
      } else {
        setTimeout(prefetchKeyRoutes, 800);
      }
    } catch (e) {
      console.debug('[appWarmup] Falha não crítica durante aquecimento:', e);
    }
  };

  // Executa o warmup assim que a CPU estiver ociosa ou logo após o primeiro render
  const ric = (window as any).requestIdleCallback;
  if (ric) {
    ric(runWarmup, { timeout: 1500 });
  } else {
    setTimeout(runWarmup, 300);
  }
}
