import { useRef, useState, useCallback, useEffect } from 'react';
import pageTurnSound from '@/assets/page-turn.mp3';
import { haptic } from '@/lib/nativeHaptics';

interface UseAulasCoverflowOptions {
  totalItems: number;
  initialIndex?: number;
  enabled?: boolean;
  onSelectCurrent?: () => void;
}

export function useAulasCoverflow({
  totalItems,
  initialIndex = 0,
  enabled = true,
  onSelectCurrent,
}: UseAulasCoverflowOptions) {
  const carouselScrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(initialIndex);
  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastSoundIndexRef = useRef<number>(-1);
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialCenteringDone = useRef(false);
  const scrollRafRef = useRef<number | null>(null);

  const playPageTurnSound = useCallback(() => {
    try {
      if (!pageTurnAudioRef.current) {
        pageTurnAudioRef.current = new Audio(pageTurnSound);
      }
      pageTurnAudioRef.current.currentTime = 0;
      pageTurnAudioRef.current.volume = 0.35;
      pageTurnAudioRef.current.playbackRate = 1.15;
      const p = pageTurnAudioRef.current.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch {}
  }, []);

  // Centraliza um card específico do carrossel suavemente ou instantaneamente
  const scrollCarouselToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth", silent: boolean = false) => {
      const el = carouselScrollerRef.current;
      if (!el) return;
      const child = el.children[idx] as HTMLElement | undefined;
      if (!child) return;
      const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({ left: Math.max(0, target), behavior });
      if (!silent && idx !== activeCarouselIndex) {
        playPageTurnSound();
      }
      setActiveCarouselIndex(idx);
    },
    [activeCarouselIndex, playPageTurnSound]
  );

  // Detecção leve de toque para diferenciar clique de arraste sem interferir no scroll nativo
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > 8 || dy > 8) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerUp = () => {
    pointerStartRef.current = null;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 60);
  };

  // Identificação do card ativo durante rolagem nativa (60-120fps liso)
  const handleCarouselScroll = useCallback(() => {
    if (scrollRafRef.current) return;

    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = carouselScrollerRef.current;
      if (!el || el.children.length === 0) return;

      const scrollerCenter = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;

      for (let i = 0; i < el.children.length; i++) {
        const child = el.children[i] as HTMLElement;
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(childCenter - scrollerCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }

      if (best !== activeCarouselIndex) {
        setActiveCarouselIndex(best);
        if (best !== lastSoundIndexRef.current) {
          lastSoundIndexRef.current = best;
          playPageTurnSound();
        }
      }
    });
  }, [activeCarouselIndex, playPageTurnSound]);

  const handlePrev = useCallback(() => {
    try { haptic.selection(); } catch {}
    playPageTurnSound();
    const prev = Math.max(0, activeCarouselIndex - 1);
    scrollCarouselToIndex(prev);
  }, [activeCarouselIndex, playPageTurnSound, scrollCarouselToIndex]);

  const handleNext = useCallback(() => {
    try { haptic.selection(); } catch {}
    playPageTurnSound();
    const el = carouselScrollerRef.current;
    const max = el ? el.children.length - 1 : activeCarouselIndex;
    const next = Math.min(max, activeCarouselIndex + 1);
    scrollCarouselToIndex(next);
  }, [activeCarouselIndex, playPageTurnSound, scrollCarouselToIndex]);

  // Centralização inicial confiável a 0ms
  useEffect(() => {
    if (!enabled) return;
    const el = carouselScrollerRef.current;
    if (!el) return;

    if (!isInitialCenteringDone.current) {
      const timer = setTimeout(() => {
        scrollCarouselToIndex(initialIndex, 'instant' as ScrollBehavior, true);
        isInitialCenteringDone.current = true;
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [enabled, initialIndex, scrollCarouselToIndex]);

  // Atalhos de teclado no Desktop (Setas e Enter)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter' && onSelectCurrent) {
        e.preventDefault();
        onSelectCurrent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleNext, handlePrev, onSelectCurrent]);

  return {
    carouselScrollerRef,
    activeCarouselIndex,
    setActiveCarouselIndex,
    scrollCarouselToIndex,
    handlePrev,
    handleNext,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleCarouselScroll,
    isDraggingRef,
    playPageTurnSound,
  };
}
