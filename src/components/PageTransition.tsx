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
  if (prefersReducedMotion || isNative) {
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
      initial={{ opacity: 0.98 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{
        duration: 0.12,
        ease: "easeOut",
      }}
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
