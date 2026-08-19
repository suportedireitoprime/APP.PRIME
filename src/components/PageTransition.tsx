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
      initial={isIOS ? { x: 50, opacity: 0 } : { opacity: 0, y: 15 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={isIOS ? { x: -50, opacity: 0 } : { opacity: 0, y: -15 }}
      transition={{
        type: "tween",
        ease: isIOS ? [0.25, 0.1, 0.25, 1] : "easeOut",
        duration: isIOS ? 0.3 : 0.2,
      }}
      style={{
        width: "100%",
        minHeight: "100dvh",
        willChange: "transform, opacity", // Força aceleração de hardware (GPU)
        backfaceVisibility: "hidden", // Evita flicker no iOS
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
