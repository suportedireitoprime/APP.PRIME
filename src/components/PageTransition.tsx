import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PageTransition = ({ children, className }: PageTransitionProps) => {
  if (prefersReducedMotion) {
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
      initial={{ opacity: 0.9, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0.95 }}
      transition={{
        duration: 0.18,
        ease: [0.16, 1, 0.3, 1], // Curva Apple fluida (120fps)
      }}
      className={className}
      style={{
        width: "100%",
        minHeight: "100dvh",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
