import { ReactNode, useRef } from "react";
import { useNavigationType } from "react-router-dom";
import { motion, useIsPresent } from "framer-motion";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const isPresent = useIsPresent();
  const containerRef = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    if (!containerRef.current) return;
    
    if (isPresent) {
      // Entrada cinematográfica: surge do fundo e entra
      gsap.fromTo(containerRef.current,
        { opacity: 0, scale: 0.96, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "power3.out", clearProps: "all" }
      );
    } else {
      // Saída: leve zoom invertido
      gsap.to(containerRef.current, {
        opacity: 0, scale: 1.04, duration: 0.35, ease: "power3.inOut"
      });
    }
  }, [isPresent]);
  
  return (
    <motion.div
      ref={containerRef}
      // Apenas para o AnimatePresence aguardar o tempo do GSAP
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      className="min-h-dvh"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
