import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1],
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
