import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    let ticking = true;

    const reset = () => {
      // 1. Janela Principal (Mobile)
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {}
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;

      // 2. Container Desktop/Tablet
      const desktopContainer = document.querySelector<HTMLElement>('#desktop-scroll-container, [data-desktop-scroll="true"]');
      if (desktopContainer) {
        desktopContainer.scrollTop = 0;
      }
      
      // 3. Qualquer outro container que possa ter overflow
      const overflowContainers = document.querySelectorAll('.overflow-y-auto, .overflow-y-scroll');
      overflowContainers.forEach(el => {
        if (el instanceof HTMLElement && !el.classList.contains('preserve-scroll')) {
          el.scrollTop = 0;
        }
      });
    };

    // Reseta imediatamente
    reset();

    // Reseta nos próximos frames para garantir que o React já renderizou o novo layout
    requestAnimationFrame(() => {
      if (ticking) reset();
      requestAnimationFrame(() => {
        if (ticking) reset();
      });
    });

    const t1 = setTimeout(reset, 10);
    const t2 = setTimeout(reset, 50);
    const t3 = setTimeout(reset, 150); // Garante reset após carregamentos curtos

    return () => {
      ticking = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  return null;
}
