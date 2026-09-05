import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopRouteProgress
 * Barra de progresso de navegação ultra-fina (estilo Vercel / Linear / GitHub).
 * Dispara automaticamente a cada troca de rota, proporcionando feedback tátil
 * instantâneo a 60-120fps sem bloquear a thread principal.
 */
export const TopRouteProgress: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Inicia a barra instantaneamente na troca de rota
    setLoading(true);
    setProgress(28);

    const timer1 = setTimeout(() => {
      setProgress(68);
    }, 80);

    const timer2 = setTimeout(() => {
      setProgress(100);
    }, 180);

    const timer3 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 380);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname, location.search]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-primary/80 via-primary to-amber-400 shadow-[0_0_12px_rgba(225,29,72,0.8)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '160ms' : progress === 68 ? '100ms' : '80ms',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
};
