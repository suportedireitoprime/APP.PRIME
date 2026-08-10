import { ReactNode } from "react";
import { useNavigationType } from "react-router-dom";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const navType = useNavigationType();
  const isPop = navType === "POP";
  
  return (
    <motion.div
      initial={isPop ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="min-h-dvh"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
