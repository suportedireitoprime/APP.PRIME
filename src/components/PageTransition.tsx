import { ReactNode } from "react";

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
  const cls = `min-h-dvh w-full max-w-full overflow-x-hidden ${className || ""}`.trim();
  return <div className={cls}>{children}</div>;
};

export default PageTransition;
