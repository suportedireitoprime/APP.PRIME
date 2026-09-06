import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeNavTelemetry } from '@/lib/navTelemetry';

/**
 * TopRouteProgress
 * Barra de progresso de navegação ultra-fina (estilo Vercel / Linear / Apple).
 * Dispara automaticamente a cada troca de rota, proporcionando feedback tátil
 * e visual instantâneo a 60-120fps sem bloquear a thread principal.
 */
export const TopRouteProgress: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeNavTelemetry((event) => {
      if (event.type === 'route-change') {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(true);
        setProgress(28);
        timerRef.current = setTimeout(() => {
          setProgress((prev) => (prev < 80 ? 75 : prev));
        }, 80);
      } else if (event.type === 'route-ready') {
        if (timerRef.current) clearTimeout(timerRef.current);
        setProgress(100);
        timerRef.current = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 200);
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Monitora alterações de rota diretamente via React Router
  useEffect(() => {
    setVisible(true);
    setProgress((prev) => (prev === 0 ? 35 : prev));
    const t1 = setTimeout(() => {
      setProgress((prev) => (prev < 85 ? 85 : prev));
    }, 60);
    const t2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 180);
    }, 150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F5E08B] to-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.9)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionDuration: progress === 100 ? '140ms' : progress === 0 ? '0ms' : '180ms',
        }}
      />
    </div>
  );
};

export default TopRouteProgress;
