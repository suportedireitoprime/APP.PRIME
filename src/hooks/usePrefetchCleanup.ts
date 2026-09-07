/**
 * usePrefetchCleanup.ts — Fase 19 de Otimização de Imagens
 * 
 * Hook que cancela automaticamente todos os downloads de prefetch de imagens
 * ao desmontar uma rota/componente, evitando:
 * 1. Desperdício de banda (Item 32 do Relatório Master)
 * 2. Competição com requests da nova tela
 * 3. Aquecimento desnecessário do rádio celular
 *
 * Uso:
 * ```tsx
 * function MinhaPage() {
 *   usePrefetchCleanup();
 *   // ... prefetchImage(url) durante a vida da página
 * }
 * ```
 */
import { useEffect, useRef } from 'react';
import { cancelAllPrefetches, prefetchImage, prefetchImages } from '@/lib/cdnImg';

/**
 * Cancela downloads pendentes ao sair da rota atual.
 * Opcionalmente recebe uma lista de URLs para pré-carregar na montagem.
 */
export function usePrefetchCleanup(initialUrls?: (string | null | undefined)[], width = 400): void {
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Prefetch inicial das URLs passadas (se houver)
    if (initialUrls && initialUrls.length > 0 && !hasPrefetched.current) {
      hasPrefetched.current = true;
      prefetchImages(initialUrls, width);
    }

    // Cleanup: cancela todos os prefetches pendentes ao sair da rota
    return () => {
      cancelAllPrefetches();
    };
  }, []); // Executa uma vez na montagem e cleanup no unmount

  return;
}

/**
 * Pré-carrega uma única imagem de forma controlada por ciclo de vida.
 * Cancela no unmount da rota/componente que o invocou.
 */
export function useSinglePrefetch(url: string | null | undefined, width = 400): void {
  useEffect(() => {
    if (url) {
      prefetchImage(url, width);
    }
    return () => {
      cancelAllPrefetches();
    };
  }, [url, width]);
}
