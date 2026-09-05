import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Transição de página simples e ultrarrápida (Fade In puro).
 * Garante troca de telas instantânea, leve e sem solavancos.
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.18,
        ease: "easeOut",
      }}
      className={className}
      style={{
        width: "100%",
        minHeight: "100dvh",
        willChange: "opacity",
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;

