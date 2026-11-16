import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import pageTurnAsset from '@/assets/page-turn.mp3.asset.json';
import { srcOf } from '@/lib/assetUrl';
import { haptic } from '@/lib/nativeHaptics';

export interface BookPageFlip3DHandle {
  flipNext: () => void;
  flipPrev: () => void;
  goToPage: (page: number) => void;
  isBusy: () => boolean;
}

interface Props {
  currentPage: number;
  totalPages: number;
  renderPage: (pageIndex: number, isBackFace?: boolean) => React.ReactNode;
  onPageChange: (newPage: number) => void;
  onTapCenter?: () => void;
  className?: string;
  enableTapNavigation?: boolean;
}

interface FlipState {
  dir: 'next' | 'prev';
  fromPage: number;
  toPage: number;
}

const BookPageFlip3D = forwardRef<BookPageFlip3DHandle, Props>(function BookPageFlip3D(
  {
    currentPage,
    totalPages,
    renderPage,
    onPageChange,
    onTapCenter,
    className = '',
    enableTapNavigation = true,
  },
  ref
) {
  const [activePage, setActivePage] = useState<number>(currentPage);
  const [flipState, setFlipState] = useState<FlipState | null>(null);
  const busyRef = useRef(false);
  const activePageRef = useRef(currentPage);

  useEffect(() => {
    activePageRef.current = currentPage;
    if (!busyRef.current) {
      setActivePage(currentPage);
    }
  }, [currentPage]);

  const playTurnSound = useCallback(() => {
    try {
      const audio = new Audio(srcOf(pageTurnAsset));
      audio.volume = 0.35;
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {}
  }, []);

  const turn = useCallback(
    (dir: 'next' | 'prev') => {
      if (busyRef.current) return;

      const current = activePageRef.current;
      const target = dir === 'next' ? current + 1 : current - 1;

      if (target < 1 || target > totalPages) {
        haptic.selection();
        return;
      }

      // Suporte a acessibilidade: reduzir movimento pula a animação direto
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        haptic.selection();
        playTurnSound();
        activePageRef.current = target;
        setActivePage(target);
        onPageChange(target);
        return;
      }

      busyRef.current = true;
      haptic.selection();
      playTurnSound();

      setFlipState({
        dir,
        fromPage: current,
        toPage: target,
      });
    },
    [totalPages, onPageChange, playTurnSound]
  );

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      // Garante que só reage à animação do container principal da folha (turnNext / turnPrev)
      if (e.target !== e.currentTarget) return;

      if (flipState) {
        const next = flipState.toPage;
        activePageRef.current = next;
        setActivePage(next);
        onPageChange(next);
      }

      setFlipState(null);
      busyRef.current = false;
    },
    [flipState, onPageChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      flipNext: () => turn('next'),
      flipPrev: () => turn('prev'),
      goToPage: (page: number) => {
        if (page < 1 || page > totalPages || page === activePageRef.current) return;
        if (page > activePageRef.current) {
          turn('next');
        } else {
          turn('prev');
        }
      },
      isBusy: () => busyRef.current,
    }),
    [turn, totalPages]
  );

  // Gestos de toque / swipe
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const diffX = touch.clientX - start.x;
    const diffY = touch.clientY - start.y;
    const duration = Date.now() - start.time;

    // Detecta swipe horizontal
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.5 && duration < 600) {
      if (diffX < 0) {
        turn('next');
      } else {
        turn('prev');
      }
      return;
    }

    // Se foi apenas um toque curto e a navegação por toque está ativada
    if (enableTapNavigation && Math.abs(diffX) < 12 && Math.abs(diffY) < 12 && duration < 350) {
      const width = window.innerWidth;
      const x = touch.clientX;
      if (x > width * 0.72) {
        turn('next');
      } else if (x < width * 0.28) {
        turn('prev');
      } else {
        onTapCenter?.();
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!enableTapNavigation) return;
    // Não interfere se o clique veio de um botão ou link interno
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, [role="button"]')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;

    if (x > w * 0.72) {
      turn('next');
    } else if (x < w * 0.28) {
      turn('prev');
    } else {
      onTapCenter?.();
    }
  };

  // Determina os conteúdos de under, front e back
  const underPage = flipState
    ? flipState.dir === 'next'
      ? flipState.toPage
      : flipState.fromPage
    : activePage;

  const frontPage = flipState
    ? flipState.dir === 'next'
      ? flipState.fromPage
      : flipState.toPage
    : activePage;

  const backPage = flipState
    ? flipState.dir === 'next'
      ? flipState.toPage
      : flipState.fromPage
    : activePage;

  return (
    <div
      className={`pagearea ${flipState ? `is-turning-${flipState.dir}` : ''} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* 1. Página de Baixo (Under) */}
      <div className="under">
        {renderPage(underPage, false)}
      </div>

      {/* Sombra projetada na página de baixo durante a virada */}
      <div className="flip-shadow" />

      {/* 2. Folha que vira em 3D */}
      <div
        className={`flip ${flipState ? `anim-${flipState.dir}` : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="face front">
          {renderPage(frontPage, false)}
        </div>
        <div className="face back">
          {renderPage(backPage, true)}
        </div>
        <div className="veil" />
      </div>
    </div>
  );
});

export default BookPageFlip3D;
