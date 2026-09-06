import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { useLocation } from 'react-router-dom';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const desktopContainer = document.querySelector<HTMLElement>(
        '#desktop-scroll-container, [data-desktop-scroll="true"]'
      );
      const y = Math.max(
        window.scrollY || document.documentElement.scrollTop || 0,
        desktopContainer ? desktopContainer.scrollTop : 0
      );
      setIsVisible(y > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const desktopContainer = document.querySelector<HTMLElement>(
      '#desktop-scroll-container, [data-desktop-scroll="true"]'
    );
    if (desktopContainer) {
      desktopContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (desktopContainer) {
        desktopContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Oculta momentaneamente na mudança de rota
  useEffect(() => {
    setIsVisible(false);
  }, [location.pathname]);

  const scrollToTop = () => {
    haptic.selection();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    const desktopContainer = document.querySelector<HTMLElement>(
      '#desktop-scroll-container, [data-desktop-scroll="true"]'
    );
    if (desktopContainer) {
      desktopContainer.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-[90px] right-4 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/40 backdrop-blur-md active:scale-95 transition-all md:bottom-8 md:right-8"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
