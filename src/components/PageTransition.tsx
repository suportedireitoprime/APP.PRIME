import { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Transição de página fluida, elegante e cinemática (Padrão Apple iOS / Material 3).
 * Utiliza aceleração nativa por GPU (transform translateZ + opacity) com curva cúbica
 * outQuint assimétrica [0.16, 1, 0.3, 1], garantindo navegação a 60-120fps sem solavancos.
 */
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.996,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.26,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.998,
    transition: {
      duration: 0.16,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

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
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
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
