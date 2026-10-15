import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { resetGlobalScroll } from '@/lib/scrollUtils';

export { resetGlobalScroll };

export default function ScrollToTop() {
  const location = useLocation();
  const observerRef = useRef<MutationObserver | null>(null);

  // useLayoutEffect garante execução síncrona ANTES da pintura na GPU
  useLayoutEffect(() => {
    let active = true;

    // Se a rota possui âncora explícita (#art-5), não forçamos topo
    if (location.hash) {
      return;
    }

    // 1. Reseta imediatamente no ciclo síncrono antes do primeiro paint
    resetGlobalScroll();

    // 2. Reseta nos frames iniciais pós-renderização do React
    requestAnimationFrame(() => {
      if (active) resetGlobalScroll();
      requestAnimationFrame(() => {
        if (active) resetGlobalScroll();
      });
    });

    // 3. Timers graduais para capturar chunks de lazy loading e hidratação de queries assíncronas
    const t1 = setTimeout(() => { if (active) resetGlobalScroll(); }, 15);
    const t2 = setTimeout(() => { if (active) resetGlobalScroll(); }, 60);
    const t3 = setTimeout(() => { if (active) resetGlobalScroll(); }, 150);
    const t4 = setTimeout(() => { if (active) resetGlobalScroll(); }, 300);
    const t5 = setTimeout(() => { if (active) resetGlobalScroll(); }, 600);

    // 4. MutationObserver por 800ms: se novos cards/conteúdos forem injetados e causarem
    // scroll involuntário pelo layout engine (scroll anchoring), traz de volta ao topo instantaneamente
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const obs = new MutationObserver(() => {
      if (!active || location.hash) return;
      const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (currentScroll > 0) {
        resetGlobalScroll();
      }
    });

    observerRef.current = obs;
    try {
      obs.observe(document.body, { childList: true, subtree: true });
    } catch {}

    const stopObsTimer = setTimeout(() => {
      obs.disconnect();
      if (observerRef.current === obs) observerRef.current = null;
    }, 800);

    return () => {
      active = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(stopObsTimer);
      obs.disconnect();
      if (observerRef.current === obs) observerRef.current = null;
    };
  }, [location.pathname, location.search, location.key, location.hash]);

  return null;
}
