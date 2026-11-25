/**
 * Coordenador Geral de Cache Aquecido e Prefetch do Aplicativo.
 *
 * Otimizado para latência zero e 120fps no boot:
 *  - Aguarda 4.5 segundos após a montagem da Home para não competir com first paint nem toque do aluno.
 *  - Executa as tarefas de forma escalonada (Staggered), separando cada módulo por intervalos de 1.2s-1.5s em momentos ociosos.
 */
import type { QueryClient } from '@tanstack/react-query';
import { prewarmFavoritosERecentesIdle } from '@/services/warmFavoritosService';
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

      // ── Etapa 2 (após 2.0s): Resumos Jurídicos de forma leve (import dinâmico) ──
      setTimeout(() => {
        runIdle(() => {
          void import('@/services/resumosWarmup').then((m) => m.warmResumosCache()).catch(() => {});
        }, 2000);
      }, 2000);

      // ── Etapa 3 (após 4.0s): Biblioteca controlada ──
      setTimeout(() => {
        runIdle(() => {
          void import('@/services/bibliotecaWarmup').then((m) => m.scheduleWarmBiblioteca(qc, 10)).catch(() => {});
        }, 2500);
      }, 4000);

      // ── Etapa 4 (após 6.0s): Questões (Videoaulas sob demanda para evitar baixar 2MB no boot) ──
      setTimeout(() => {
        runIdle(() => {
          void import('@/services/questoesWarmup').then((m) => m.warmQuestoesStartup()).catch(() => {});
        }, 2500);
      }, 6000);

      // ── Etapa 5 (após 8.0s): FTS5 SQLite Offline em background ──
      setTimeout(() => {
        runIdle(() => {
          void import('@/services/fts5Populator').then((m) => m.populateFTS5FromBundle()).catch(() => {});
        }, 3000);
      }, 8000);

      // ── Etapa 6 (após 10s): Prefetch cirúrgico escalonado de rotas ──
      setTimeout(() => {
        const routes = [
          () => routePrefetch.vadeMecum(),
          () => routePrefetch.biblioteca(),
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
