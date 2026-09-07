import { useEffect, useRef } from 'react';

const activeLocks = new Set<string>();
let scrollLockDepth = 0;
let observer: MutationObserver | null = null;

const apply = () => {
  if (typeof document === 'undefined') return;
  const b = document.body;
  const h = document.documentElement;
  b.style.overflow = 'hidden';
  b.style.overscrollBehavior = 'none';
  h.style.overflow = 'hidden';
  b.setAttribute('data-scroll-locked', '1');
  ensureObserver();
};

/**
 * Ao liberar, limpamos os estilos inline somente quando todos os modais/sheets aninhados tiverem fechado.
 */
const release = () => {
  if (typeof document === 'undefined') return;
  if (scrollLockDepth > 0 || activeLocks.size > 0) {
    apply();
    return;
  }
  const hasOpenSheet = document.querySelector('[data-artigo-sheet="open"]');
  if (hasOpenSheet) {
    apply();
    return;
  }

  const b = document.body;
  const h = document.documentElement;
  b.style.overflow = '';
  b.style.touchAction = '';
  b.style.overscrollBehavior = '';
  b.style.position = '';
  b.style.top = '';
  b.style.width = '';
  b.style.pointerEvents = '';
  b.removeAttribute('data-scroll-locked');
  h.style.overflow = '';

  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

function ensureObserver() {
  if (typeof document === 'undefined' || observer) return;
  observer = new MutationObserver(() => {
    const shouldBeLocked =
      scrollLockDepth > 0 ||
      activeLocks.size > 0 ||
      Boolean(document.querySelector('[data-artigo-sheet="open"]'));
    if (shouldBeLocked) {
      const b = document.body;
      if (b.style.overflow !== 'hidden') {
        b.style.overflow = 'hidden';
        b.style.overscrollBehavior = 'none';
        document.documentElement.style.overflow = 'hidden';
        b.setAttribute('data-scroll-locked', '1');
      }
    }
  });

  try {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    });
  } catch {}
}

/**
 * Força o desbloqueio completo do body e zera o contador de locks.
 * Utilizado no fechamento de modais/sheets para garantir que a tela nunca fique congelada.
 * Se force = false, respeita folhas ativas ainda presentes no DOM (ex: ArtigoBottomSheet).
 */
export function resetBodyScrollLock(force = false) {
  if (typeof document === 'undefined') return;

  if (!force) {
    const hasOpenSheet = document.querySelector('[data-artigo-sheet="open"]');
    if (hasOpenSheet) {
      apply();
      return;
    }
  }

  activeLocks.clear();
  scrollLockDepth = 0;
  release();
}

/**
 * Impede que o conteúdo por trás (home do app, listas, etc.) role
 * enquanto uma folha/overlay estiver aberta. Suporta modais aninhados e contagem de pilha resiliente.
 */
export function useBodyScrollLock(locked: boolean, lockId?: string) {
  const generatedId = useRef<string>(`lock_${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const id = lockId || generatedId.current;
    if (!locked) {
      if (activeLocks.has(id)) {
        activeLocks.delete(id);
        scrollLockDepth = Math.max(0, scrollLockDepth - 1);
        if (activeLocks.size === 0 && scrollLockDepth === 0) {
          release();
        }
      }
      return;
    }

    if (!activeLocks.has(id)) {
      activeLocks.add(id);
      scrollLockDepth += 1;
    }
    apply();

    return () => {
      activeLocks.delete(id);
      scrollLockDepth = Math.max(0, scrollLockDepth - 1);
      if (activeLocks.size === 0 && scrollLockDepth === 0) {
        release();
      }
    };
  }, [locked, lockId]);
}

export default useBodyScrollLock;
