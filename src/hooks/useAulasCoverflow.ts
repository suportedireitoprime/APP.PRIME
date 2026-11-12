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
  initialIndex = 1,
  enabled = true,
  onSelectCurrent,
}: UseAulasCoverflowOptions) {
  const carouselScrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(initialIndex);
  const isDraggingRef = useRef(false);
  const lastSoundIndexRef = useRef<number>(-1);
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);

  const playPageTurnSound = useCallback(() => {
    try {
      if (!pageTurnAudioRef.current) {
        pageTurnAudioRef.current = new Audio(pageTurnSound);
      }
      pageTurnAudioRef.current.currentTime = 0;
      pageTurnAudioRef.current.volume = 0.4;
      pageTurnAudioRef.current.playbackRate = 1.15;
      const p = pageTurnAudioRef.current.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch {}
  }, []);

  // Rastreador de toque e velocidade 1:1 ultra-fluida com inércia do dedo
  const dragTrackerRef = useRef<{
    startX: number;
    startY: number;
    startScrollLeft: number;
    points: { x: number; time: number }[];
    isPointerDown: boolean;
    isHorizontalDrag: boolean | null;
  }>({
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    points: [],
    isPointerDown: false,
    isHorizontalDrag: null,
  });

  // Interpolação suave e contínua do zoom e opacidade das capas (120fps Coverflow)
  const updateCoverFlowTransforms = useCallback(() => {
    const el = carouselScrollerRef.current;
    if (!el) return;
    const scrollerRect = el.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
    const children = el.children;
    const count = children.length;
    for (let i = 0; i < count; i++) {
      const child = children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const dist = Math.abs(childCenter - scrollerCenter) / (childRect.width || 1);
      const norm = Math.min(2, dist);
      const factor = Math.max(0, 1 - norm * 0.65);
      const scale = 0.86 + factor * 0.18; // 0.86 nos lados até 1.04 no centro
      const opacity = 0.50 + factor * 0.50; // 0.50 nos lados até 1.00 no centro
      const inner = child.firstElementChild as HTMLElement;
      if (inner) {
        inner.style.transform = `scale(${scale.toFixed(3)})`;
        inner.style.opacity = opacity.toFixed(3);
      }
    }
  }, []);

  const scrollCarouselToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth", silent: boolean = false) => {
      const el = carouselScrollerRef.current;
      if (!el) return;
      const child = el.children[idx] as HTMLElement | undefined;
      if (!child) return;
      const scrollerRect = el.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
      const childCenter = childRect.left + childRect.width / 2;
      const diff = childCenter - scrollerCenter;
      el.scrollTo({ left: el.scrollLeft + diff, behavior });
      if (!silent && idx !== activeCarouselIndex) {
        playPageTurnSound();
      }
      setActiveCarouselIndex(idx);
      setTimeout(updateCoverFlowTransforms, 20);
    },
    [activeCarouselIndex, playPageTurnSound, updateCoverFlowTransforms]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = carouselScrollerRef.current;
    if (!el) return;

    el.style.scrollBehavior = 'auto';
    el.style.scrollSnapType = 'none';

    dragTrackerRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: el.scrollLeft,
      points: [{ x: e.clientX, time: performance.now() }],
      isPointerDown: true,
      isHorizontalDrag: null,
    };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const tracker = dragTrackerRef.current;
    if (!tracker.isPointerDown) return;
    const el = carouselScrollerRef.current;
    if (!el) return;

    const dx = e.clientX - tracker.startX;
    const dy = e.clientY - tracker.startY;

    if (tracker.isHorizontalDrag === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        tracker.isHorizontalDrag = Math.abs(dx) >= Math.abs(dy);
      }
    }

    if (!tracker.isHorizontalDrag) return;

    if (Math.abs(dx) > 6) {
      isDraggingRef.current = true;
    }

    el.scrollLeft = tracker.startScrollLeft - dx;
    updateCoverFlowTransforms();

    const now = performance.now();
    tracker.points.push({ x: e.clientX, time: now });
    if (tracker.points.length > 7) {
      tracker.points.shift();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const tracker = dragTrackerRef.current;
    if (!tracker.isPointerDown) return;
    tracker.isPointerDown = false;
    const el = carouselScrollerRef.current;
    if (!el) return;

    el.style.scrollBehavior = 'smooth';
    el.style.scrollSnapType = 'x mandatory';

    const now = performance.now();
    const recent = tracker.points.filter(p => now - p.time < 130);
    let vx = 0;
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.time - first.time) || 1;
      vx = (last.x - first.x) / dt;
    }

    const totalDx = e.clientX - tracker.startX;

    if (isDraggingRef.current) {
      const center = el.scrollLeft + el.clientWidth / 2;
      let closestIdx = 0;
      let minDistance = Infinity;
      for (let i = 0; i < el.children.length; i++) {
        const child = el.children[i] as HTMLElement;
        const mid = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      let targetIdx = closestIdx;
      if (vx < -0.35 || totalDx < -45) {
        const step = Math.abs(vx) > 1.2 ? 2 : 1;
        targetIdx = Math.min(el.children.length - 1, activeCarouselIndex + step);
      } else if (vx > 0.35 || totalDx > 45) {
        const step = Math.abs(vx) > 1.2 ? 2 : 1;
        targetIdx = Math.max(0, activeCarouselIndex - step);
      }

      scrollCarouselToIndex(targetIdx, "smooth");
    }

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);
  };

  const handleCarouselScroll = useCallback(() => {
    const el = carouselScrollerRef.current;
    if (!el) return;

    const scrollerRect = el.getBoundingClientRect();
    const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const dist = Math.abs(childCenter - scrollerCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }

    updateCoverFlowTransforms();

    if (best !== activeCarouselIndex && best !== lastSoundIndexRef.current) {
      lastSoundIndexRef.current = best;
      playPageTurnSound();
    }

    const N = totalItems;
    if (N > 1) {
      if (best <= 1) {
        const jumpTo = best + N;
        const targetChild = el.children[jumpTo] as HTMLElement;
        if (targetChild) {
          const targetRect = targetChild.getBoundingClientRect();
          const targetCenter = targetRect.left + targetRect.width / 2;
          const diff = targetCenter - scrollerCenter;
          el.scrollLeft += diff;
          setActiveCarouselIndex(jumpTo);
          updateCoverFlowTransforms();
          return;
        }
      } else if (best >= 2 * N + 1) {
        const jumpTo = best - N;
        const targetChild = el.children[jumpTo] as HTMLElement;
        if (targetChild) {
          const targetRect = targetChild.getBoundingClientRect();
          const targetCenter = targetRect.left + targetRect.width / 2;
          const diff = targetCenter - scrollerCenter;
          el.scrollLeft += diff;
          setActiveCarouselIndex(jumpTo);
          updateCoverFlowTransforms();
          return;
        }
      }
    }

    if (best !== activeCarouselIndex) {
      setActiveCarouselIndex(best);
    }
  }, [activeCarouselIndex, playPageTurnSound, totalItems, updateCoverFlowTransforms]);

  const handlePrev = useCallback(() => {
    try { haptic.selection(); } catch {}
    playPageTurnSound();
    scrollCarouselToIndex(activeCarouselIndex - 1);
  }, [activeCarouselIndex, playPageTurnSound, scrollCarouselToIndex]);

  const handleNext = useCallback(() => {
    try { haptic.selection(); } catch {}
    playPageTurnSound();
    scrollCarouselToIndex(activeCarouselIndex + 1);
  }, [activeCarouselIndex, playPageTurnSound, scrollCarouselToIndex]);

  // Garante que SEMPRE que o usuário entrar na tela, a capa ativa esteja IMEDIATAMENTE centralizada a 0ms
  useEffect(() => {
    if (!enabled) return;
    const el = carouselScrollerRef.current;
    if (!el) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const centerTarget = () => {
      if (cancelled) return;
      const child = el.children[initialIndex] as HTMLElement | undefined;
      if (!child) return;
      const scrollerRect = el.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      if (scrollerRect.width === 0 || childRect.width === 0) return;
      const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
      const childCenter = childRect.left + childRect.width / 2;
      const diff = childCenter - scrollerCenter;

      if (Math.abs(diff) > 0.5) {
        el.style.scrollSnapType = 'none';
        el.scrollLeft += diff;
        requestAnimationFrame(() => {
          if (!cancelled && el) {
            el.style.scrollSnapType = 'x mandatory';
          }
        });
      }
      setActiveCarouselIndex(initialIndex);
      updateCoverFlowTransforms();
    };

    // Tentativa imediata
    centerTarget();

    // Reforço progressivo cobrindo layout assíncrono e montagem de imagens
    const rafId = requestAnimationFrame(centerTarget);
    [20, 50, 100, 200, 400, 700].forEach(ms => {
      timers.push(setTimeout(centerTarget, ms));
    });

    // Re-centralizar em caso de redimensionamento de janela ou rotação
    const handleResize = () => {
      if (cancelled) return;
      const currentIdx = activeCarouselIndex;
      const child = el.children[currentIdx] as HTMLElement | undefined;
      if (!child) return;
      const scrollerRect = el.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      if (scrollerRect.width === 0 || childRect.width === 0) return;
      const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;
      const childCenter = childRect.left + childRect.width / 2;
      const diff = childCenter - scrollerCenter;
      if (Math.abs(diff) > 0.5) {
        el.scrollLeft += diff;
      }
      updateCoverFlowTransforms();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, initialIndex, updateCoverFlowTransforms]);

  // Suporte nativo a atalhos de teclado no Desktop (Setas, Enter, Home, End)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em campos de input ou textarea
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
    updateCoverFlowTransforms,
  };
}

