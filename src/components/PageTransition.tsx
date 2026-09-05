import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Transição de página de alto padrão utilizada por Big Techs (Apple, Linear, Vercel, Stripe).
 * Utiliza aceleração de hardware (GPU translateZ), micro-elevação (4px), amortecimento
 * sutil de escala (0.994 -> 1) e curva elástica premium (ease [0.16, 1, 0.3, 1]).
 */
const PageTransition = ({ children, className }: PageTransitionProps) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          minHeight: "100dvh",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.994 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -3, scale: 0.998 }}
      transition={{
        duration: 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      style={{
        width: "100%",
        minHeight: "100dvh",
        willChange: "transform, opacity",
        transform: "translateZ(0)",
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;

