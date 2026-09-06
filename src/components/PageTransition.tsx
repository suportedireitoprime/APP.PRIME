import { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  instant?: boolean;
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
    transition: {
      duration: 0.08, // Padronizado em 80ms para saída ultra-rápida sem retenção de frame
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

const PageTransition = ({ children, className, instant }: PageTransitionProps) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion || instant) {
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
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
