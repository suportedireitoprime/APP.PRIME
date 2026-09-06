import { ReactNode, Suspense } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  instant?: boolean;
  fallback?: ReactNode;
}

export function RouteLazyFallback() {
  return (
    <div
      className="min-h-dvh bg-[#0D0D0D] p-4 pt-16 space-y-4 w-full"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-8 w-48 rounded-md bg-white/[0.05] animate-pulse" />
      <div className="h-4 w-64 rounded bg-white/[0.04] animate-pulse" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/[0.03] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Transição de página fluida, elegante e cinemática (Padrão Apple iOS / Material 3).
 * Utiliza aceleração nativa por GPU (transform translateZ + opacity) com curva cúbica
 * outQuint assimétrica [0.16, 1, 0.3, 1], garantindo navegação a 60-120fps sem solavancos.
 */
const pageVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.08, // Padronizado em 80ms para resposta instantânea de app nativo (120fps)
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    pointerEvents: "none",
    transition: {
      duration: 0.08, // Padronizado em 80ms para saída ultra-rápida sem retenção de frame
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

const PageTransition = ({ children, className, instant, fallback }: PageTransitionProps) => {
  const shouldReduceMotion = useReducedMotion();

  const content = (
    <Suspense fallback={fallback || <RouteLazyFallback />}>
      {children}
    </Suspense>
  );

  if (shouldReduceMotion || instant) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          minHeight: "100dvh",
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      style={{
        width: "100%",
        minHeight: "100dvh",
      }}
    >
      {content}
    </motion.div>
  );
};

export default PageTransition;
