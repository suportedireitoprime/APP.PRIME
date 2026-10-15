import { ReactNode, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

import { resetGlobalScroll } from "@/lib/scrollUtils";

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
    resetGlobalScroll();
  }, [location.pathname, location.search, location.key]);

  const cls = `min-h-dvh w-full max-w-full overflow-x-hidden ${className || ""}`.trim();
  return <div className={cls}>{children}</div>;
};

export default PageTransition;
