/**
 * useCarouselPrefetch.ts — Fase 21 de Otimização de Imagens
 * 
 * Hook preditivo de pré-carregamento em memória para carrosséis horizontais,
 * estantes de livros e trilhas pedagógicas.
 * 
 * Engenharia:
 * 1. Monitora a posição de rolagem horizontal (scrollLeft) e calcula dinamicamente
 *    os índices visíveis no viewport.
 * 2. Detecta a direção do scroll (avançando para a direita ou retornando).
 * 3. Faz o prefetch em background com `requestIdleCallback` (fallback setTimeout)
 *    apenas dos N itens à frente no scroll, mantendo o uso de memória sob controle.
 * 4. Ao chegar no card, a imagem já está no cache decodificada pela GPU (0ms de latência).
 */
import { useEffect, useRef, useCallback } from 'react';
import { prefetchImage } from '@/lib/cdnImg';

interface UseCarouselPrefetchOptions {
  /** Largura média estimada do card em pixels (default: 140) */
  itemWidth?: number;
  /** Quantos itens à frente devem ser pré-carregados (default: 4) */
  lookahead?: number;
  /** Largura alvo da imagem para download otimizado (default: 300) */
  targetWidth?: number;
}

export function useCarouselPrefetch<T>(
  items: T[],
  getImageUrl: (item: T) => string | null | undefined,
  options: UseCarouselPrefetchOptions = {}
) {
  const { itemWidth = 140, lookahead = 4, targetWidth = 300 } = options;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollLeft = useRef(0);
  const prefetchedIndices = useRef<Set<number>>(new Set());
  const idleHandleRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!abortControllerRef.current) {
    abortControllerRef.current = new AbortController();
  }

  const prefetchIndex = useCallback((idx: number) => {
    if (idx < 0 || idx >= items.length || prefetchedIndices.current.has(idx)) return;
    const url = getImageUrl(items[idx]);
    if (url) {
      prefetchedIndices.current.add(idx);
      prefetchImage(url, targetWidth, abortControllerRef.current?.signal);
    }
  }, [items, getImageUrl, targetWidth]);

  // Pré-aquecimento inicial dos primeiros cards visíveis e do buffer imediato
  useEffect(() => {
    if (!items || items.length === 0) return;

    const initialBuffer = Math.min(lookahead + 2, items.length);
    for (let i = 0; i < initialBuffer; i++) {
      prefetchIndex(i);
    }
  }, [items, lookahead, prefetchIndex]);

  // Listener de rolagem com debounce desacoplado via requestIdleCallback
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || items.length === 0) return;

    const currentScrollLeft = el.scrollLeft;
    const isMovingForward = currentScrollLeft >= lastScrollLeft.current;
    lastScrollLeft.current = currentScrollLeft;

    // Cancela agendamento anterior para não acumular trabalho no idle loop
    if (idleHandleRef.current !== null) {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleHandleRef.current);
      } else {
        clearTimeout(idleHandleRef.current);
      }
      idleHandleRef.current = null;
    }

    const scheduleTask = (cb: () => void) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        return (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
          .requestIdleCallback(cb, { timeout: 200 });
      }
      return window.setTimeout(cb, 50);
    };

    idleHandleRef.current = scheduleTask(() => {
      const containerWidth = el.clientWidth || 360;
      const firstVisibleIdx = Math.floor(currentScrollLeft / itemWidth);
      const visibleCount = Math.ceil(containerWidth / itemWidth);
      const lastVisibleIdx = firstVisibleIdx + visibleCount;

      if (isMovingForward) {
        // Rotação para a direita: pré-carrega os próximos itens
        for (let i = lastVisibleIdx; i <= lastVisibleIdx + lookahead; i++) {
          prefetchIndex(i);
        }
      } else {
        // Retorno para a esquerda: pré-carrega os itens anteriores caso ainda não cacheados
        for (let i = firstVisibleIdx - lookahead; i < firstVisibleIdx; i++) {
          prefetchIndex(i);
        }
      }
    });
  }, [items, itemWidth, lookahead, prefetchIndex]);

  useEffect(() => {
    return () => {
      if (idleHandleRef.current !== null) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleHandleRef.current);
        } else {
          clearTimeout(idleHandleRef.current);
        }
      }
      prefetchedIndices.current.clear();
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    scrollerRef,
    onScroll,
  };
}
