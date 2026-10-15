import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { resetGlobalScroll } from '@/lib/scrollUtils';

export default function ScrollToTop() {
  const location = useLocation();
  const observerRef = useRef<MutationObserver | null>(null);

  // useLayoutEffect garante execução síncrona ANTES da pintura na GPU
  useLayoutEffect(() => {
    let active = true;
    let userScrolledManually = false;

    // Se a rota possui âncora explícita (#art-5), não forçamos topo
    if (location.hash) {
      return;
    }

    // Flag para detectar se o usuário já tocou ativamente na tela após abrir a nova página
    const onUserTouch = () => {
      userScrolledManually = true;
    };
    window.addEventListener('touchstart', onUserTouch, { passive: true, capture: true });
    window.addEventListener('mousedown', onUserTouch, { passive: true, capture: true });
    window.addEventListener('wheel', onUserTouch, { passive: true, capture: true });

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
    const t1 = setTimeout(() => { if (active && !userScrolledManually) resetGlobalScroll(); }, 20);
    const t2 = setTimeout(() => { if (active && !userScrolledManually) resetGlobalScroll(); }, 60);
    const t3 = setTimeout(() => { if (active && !userScrolledManually) resetGlobalScroll(); }, 120);
    const t4 = setTimeout(() => { if (active && !userScrolledManually) resetGlobalScroll(); }, 250);
    const t5 = setTimeout(() => { if (active && !userScrolledManually) resetGlobalScroll(); }, 500);
    const t6 = setTimeout(() => { if (active && !userScrolledManually) resetGlobalScroll(); }, 800);
    const t7 = setTimeout(() => { if (active && !userScrolledManually) resetGlobalScroll(); }, 1200);

    // 4. Intercepta saltos involuntários de scroll restoration ou inércia da rota anterior
    const onScrollCheck = () => {
      if (!active || location.hash || userScrolledManually) return;
      const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const desktopContainer = document.querySelector<HTMLElement>('#desktop-scroll-container, [data-desktop-scroll="true"]');
      const containerScroll = desktopContainer ? desktopContainer.scrollTop : 0;
      if (currentScroll > 0 || containerScroll > 0) {
        resetGlobalScroll();
      }
    };
    window.addEventListener('scroll', onScrollCheck, { passive: true });
    const desktopEl = document.querySelector<HTMLElement>('#desktop-scroll-container, [data-desktop-scroll="true"]');
    if (desktopEl) {
      desktopEl.addEventListener('scroll', onScrollCheck, { passive: true });
    }

    // 5. MutationObserver por 1200ms: se novos cards/conteúdos forem injetados e causarem
    // scroll involuntário pelo layout engine (scroll anchoring), traz de volta ao topo instantaneamente
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const obs = new MutationObserver(() => {
      if (!active || location.hash || userScrolledManually) return;
      const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const desktopContainer = document.querySelector<HTMLElement>('#desktop-scroll-container, [data-desktop-scroll="true"]');
      const containerScroll = desktopContainer ? desktopContainer.scrollTop : 0;
      if (currentScroll > 0 || containerScroll > 0) {
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
      window.removeEventListener('scroll', onScrollCheck);
      if (desktopEl) desktopEl.removeEventListener('scroll', onScrollCheck);
      window.removeEventListener('touchstart', onUserTouch, true);
      window.removeEventListener('mousedown', onUserTouch, true);
      window.removeEventListener('wheel', onUserTouch, true);
    }, 1200);

    return () => {
      active = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(stopObsTimer);
      obs.disconnect();
      if (observerRef.current === obs) observerRef.current = null;
      window.removeEventListener('scroll', onScrollCheck);
      if (desktopEl) desktopEl.removeEventListener('scroll', onScrollCheck);
      window.removeEventListener('touchstart', onUserTouch, true);
      window.removeEventListener('mousedown', onUserTouch, true);
      window.removeEventListener('wheel', onUserTouch, true);
    };
  }, [location.pathname, location.search, location.key, location.hash]);

  return null;
}
