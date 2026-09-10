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
import { warmQuestoesStartup } from '@/services/questoesWarmup';
import { prewarmFavoritosERecentesIdle } from '@/services/warmFavoritosService';
import { routePrefetch } from '@/lib/routePrefetch';
import brasaoImg from '@/assets/brasao-republica.webp';

let appWarmupStarted = false;

export function scheduleAppWarmup(qc: QueryClient): void {
  if (appWarmupStarted || typeof window === 'undefined') return;
  appWarmupStarted = true;

  // 1. Respeita economia de dados (Save-Data) e redes móveis lentas
  if (typeof navigator !== 'undefined') {
    if (!navigator.onLine) return;
    // @ts-expect-error NetworkInformation experimental
    if (navigator.connection?.saveData === true) return;
    // @ts-expect-error NetworkInformation experimental
    const connType = navigator.connection?.effectiveType;
    if (connType === 'slow-2g' || connType === '2g') return;
  }

  const runWarmup = () => {
    try {
      // 1. Aquece Vade Mecum (favoritos e recentes em cache local síncrono)
      prewarmFavoritosERecentesIdle();
      try {
        const img = new Image();
        img.decoding = 'async';
        (img as any).fetchPriority = 'low';
        img.src = brasaoImg;
      } catch {
        /* noop */
      }

      // 2. Aquece Resumos Jurídicos de forma leve (usa catálogo estruturado de 470KB)
      void warmResumosCache();

      // 3. Aquece Biblioteca com limite controlado em segundo plano
      scheduleWarmBiblioteca(qc, 12);

      // 4. Aquece Videoaulas e Questões
      warmVideoaulasStartup();
      warmQuestoesStartup();

      // 5. Pré-carregamento cirúrgico de rotas em etapas (Staggered Prefetch)
      // Evita baixar 7 páginas pesadas de uma só vez na rede móvel
      const routes = [
        () => routePrefetch.vadeMecum(),
        () => routePrefetch.biblioteca(),
        () => routePrefetch.aprender(),
      ];

      let idx = 0;
      const stepPrefetch = () => {
        if (idx < routes.length) {
          try {
            routes[idx]();
          } catch {}
          idx++;
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as any).requestIdleCallback(stepPrefetch, { timeout: 3000 });
          } else {
            setTimeout(stepPrefetch, 1500);
          }
        }
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(stepPrefetch, { timeout: 2500 });
      } else {
        setTimeout(stepPrefetch, 1200);
      }
    } catch (e) {
      console.debug('[appWarmup] Falha não crítica durante aquecimento:', e);
    }
  };

  // Aguarda 3.5s após a montagem da tela para garantir First Meaningful Paint suave a 120fps
  setTimeout(() => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(runWarmup, { timeout: 3000 });
    } else {
      setTimeout(runWarmup, 1000);
    }
  }, 3500);
}
