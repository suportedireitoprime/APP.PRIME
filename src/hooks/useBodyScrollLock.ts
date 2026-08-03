import { useEffect } from 'react';

let lockCount = 0;

const apply = () => {
  if (lockCount !== 1) return;
  const b = document.body;
  const h = document.documentElement;
  b.style.overflow = 'hidden';
  b.style.touchAction = 'none';
  b.style.overscrollBehavior = 'none';
  h.style.overflow = 'hidden';
};

/**
 * Ao liberar, limpamos os estilos inline em vez de restaurar um "valor
 * anterior" — restaurar um snapshot antigo podia recolocar `overflow: hidden`
 * quando duas folhas fechavam ao mesmo tempo, travando o app.
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
 * Impede que o conteúdo por trás (home do app, listas, etc.) role ou receba
 * gestos enquanto uma folha/overlay estiver aberta. Suporta folhas empilhadas.
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
