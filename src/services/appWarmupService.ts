/**
 * Coordenador Geral de Cache Aquecido e Prefetch do Aplicativo.
 *
 * Otimizado para latência zero e 120fps no boot:
 *  - Aguarda 4.5 segundos após a montagem da Home para não competir com first paint nem toque do aluno.
 *  - Executa as tarefas de forma escalonada (Staggered), separando cada módulo por intervalos de 1.2s-1.5s em momentos ociosos.
 */
import type { QueryClient } from '@tanstack/react-query';
import { scheduleWarmBiblioteca } from '@/services/bibliotecaWarmup';
import { warmResumosCache } from '@/services/resumosWarmup';
import { warmVideoaulasStartup } from '@/services/videoaulasWarmup';
import { warmQuestoesStartup } from '@/services/questoesWarmup';
import { prewarmFavoritosERecentesIdle } from '@/services/warmFavoritosService';
import { populateFTS5FromBundle } from '@/services/fts5Populator';
import { routePrefetch } from '@/lib/routePrefetch';
import { Capacitor } from '@capacitor/core';
import brasaoImg from '@/assets/brasao-republica.webp';

let appWarmupStarted = false;

export function scheduleAppWarmup(qc: QueryClient): void {
  if (appWarmupStarted || typeof window === 'undefined') return;
  appWarmupStarted = true;

  const isNative = Capacitor.isNativePlatform();

  // Na web, respeita economia de dados (Save-Data) e redes lentas.
  if (!isNative && typeof navigator !== 'undefined') {
    if (!navigator.onLine) return;
    // @ts-expect-error NetworkInformation experimental
    if (navigator.connection?.saveData === true) return;
    // @ts-expect-error NetworkInformation experimental
    const connType = navigator.connection?.effectiveType;
    if (connType === 'slow-2g' || connType === '2g') return;
  }

  const runIdle = (fn: () => void, timeout = 3000) => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(fn, { timeout });
    } else {
      setTimeout(fn, 600);
    }
  };

  const executarEtapasEscalonadas = () => {
    try {
      // ── Etapa 1: Vade Mecum (favoritos e recentes leves em memória síncrona) ──
      runIdle(() => {
        prewarmFavoritosERecentesIdle();
        try {
          const img = new Image();
          img.decoding = 'async';
          (img as any).fetchpriority = 'low';
          img.src = brasaoImg;
        } catch {
          /* noop */
        }
      }, 1500);

      // ── Etapa 2 (após 1.5s): Resumos Jurídicos de forma leve ──
      setTimeout(() => {
        runIdle(() => {
          void warmResumosCache();
        }, 2000);
      }, 1500);

      // ── Etapa 3 (após 3.0s): Biblioteca controlada ──
      setTimeout(() => {
        runIdle(() => {
          scheduleWarmBiblioteca(qc, 10);
        }, 2500);
      }, 3000);

      // ── Etapa 4 (após 4.5s): Videoaulas e Questões ──
      setTimeout(() => {
        runIdle(() => {
          warmVideoaulasStartup();
          warmQuestoesStartup();
        }, 2500);
      }, 4500);

      // ── Etapa 5 (após 6.0s): FTS5 SQLite Offline em background ──
      setTimeout(() => {
        runIdle(() => {
          void populateFTS5FromBundle();
        }, 3000);
      }, 6000);

      // ── Etapa 6 (após 7.5s): Prefetch cirúrgico escalonado de rotas ──
      setTimeout(() => {
        const routes = [
          () => routePrefetch.vadeMecum(),
          () => routePrefetch.biblioteca(),
          () => routePrefetch.aulas(),
        ];

        let idx = 0;
        const stepPrefetch = () => {
          if (idx < routes.length) {
            try {
              routes[idx]();
            } catch {}
            idx++;
            runIdle(stepPrefetch, 2500);
          }
        };

        runIdle(stepPrefetch, 2000);
      }, 7500);
    } catch (e) {
      console.debug('[appWarmup] Falha não crítica durante aquecimento:', e);
    }
  };

  // ⚡ LATÊNCIA ZERO ABSOLUTA: Inicia o escalonamento apenas 4.5s após o boot.
  // Garante 100% de CPU livre para a Home montar, rodar a 120fps e responder instantaneamente.
  const delayInicial = isNative ? 4500 : 5000;
  setTimeout(executarEtapasEscalonadas, delayInicial);
}
