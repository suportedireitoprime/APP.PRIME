import { useEffect } from 'react';

let lockCount = 0;

const apply = () => {
  if (lockCount < 1) return;
  const b = document.body;
  const h = document.documentElement;
  b.style.overflow = 'hidden';
  b.style.overscrollBehavior = 'none';
  h.style.overflow = 'hidden';
};

/**
 * Ao liberar, limpamos os estilos inline para restaurar o comportamento normal.
 */
const release = () => {
  if (lockCount !== 0) return;
  const b = document.body;
  const h = document.documentElement;
  b.style.overflow = '';
  b.style.touchAction = '';
  b.style.overscrollBehavior = '';
  h.style.overflow = '';
};

/**
 * Força o desbloqueio completo do body e zera o contador de locks.
 * Utilizado no fechamento de modais/sheets para garantir que a tela nunca fique congelada.
 */
export function resetBodyScrollLock() {
  lockCount = 0;
  release();
}

/**
 * Impede que o conteúdo por trás (home do app, listas, etc.) role
 * enquanto uma folha/overlay estiver aberta. Suporta folhas empilhadas.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockCount += 1;
    apply();
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      release();
    };
  }, [locked]);
}

export default useBodyScrollLock;
