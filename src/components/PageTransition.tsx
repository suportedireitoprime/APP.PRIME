import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";

interface PageTransitionProps {
  children: ReactNode;
}

const isIOS = Capacitor.getPlatform() === 'ios';

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100dvh",
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
