import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";

interface PageTransitionProps {
  children: ReactNode;
}

const isIOS = Capacitor.getPlatform() === 'ios';

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        type: "tween",
        ease: "easeOut",
        duration: 0.15,
      }}
      style={{
        width: "100%",
        minHeight: "100dvh",
        willChange: "opacity, transform"
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
