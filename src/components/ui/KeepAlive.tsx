import React, { useRef, useEffect } from 'react';

interface KeepAliveProps {
  /** Se o bloco deve ser visível ou não */
  active: boolean;
  /** Conteúdo a ser mantido vivo na DOM */
  children: React.ReactNode;
  /** Classes extras para o contêiner */
  className?: string;
  /** Se deve restaurar o scroll global (window.scrollY) quando voltar a ficar ativo */
  restoreScroll?: boolean;
}

export function KeepAlive({ active, children, className = '', restoreScroll = true }: KeepAliveProps) {
  const scrollPos = useRef(0);
  const wasActive = useRef(active);

  useEffect(() => {
    if (!restoreScroll) {
      wasActive.current = active;
      return;
    }

    if (wasActive.current && !active) {
      // Transitioning from active to inactive -> save scroll
      scrollPos.current = window.scrollY;
    } else if (!wasActive.current && active) {
      // Transitioning from inactive to active -> restore scroll
      // Usamos requestAnimationFrame para garantir que a DOM do display:block já esteja calculada
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPos.current, behavior: 'instant' });
      });
    }
    wasActive.current = active;
  }, [active, restoreScroll]);

  return (
    <div
      className={className}
      style={{
        display: active ? 'block' : 'none',
      }}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}
