import { ReactNode, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  instant?: boolean;
  fallback?: ReactNode;
}

/**
 * Contêiner de página nativo puro (Padrão Ouro 0ms Latência).
 * Renderização 100% instantânea sem wrappers de animação ou delays de JS.
 */
const PageTransition = ({ children, className }: PageTransitionProps) => {
  const location = useLocation();

  useLayoutEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {}
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    const desktopContainer = document.querySelector<HTMLElement>('#desktop-scroll-container, [data-desktop-scroll="true"]');
    if (desktopContainer) {
      desktopContainer.scrollTop = 0;
    }
    
    const overflowContainers = document.querySelectorAll('.overflow-y-auto, .overflow-y-scroll');
    overflowContainers.forEach(el => {
      if (el instanceof HTMLElement && !el.classList.contains('preserve-scroll')) {
        el.scrollTop = 0;
      }
    });
  }, [location.pathname]);

  const cls = `min-h-dvh w-full max-w-full overflow-x-hidden ${className || ""}`.trim();
  return <div className={cls}>{children}</div>;
};

export default PageTransition;
