import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import { useLocation } from 'react-router-dom';

/**
 * Verifica se a rota atual possui listas longas de leitura (Vade Mecum, Blog, Notícias, etc.)
 * onde o botão de voltar ao topo é útil e autorizado.
 * No início do aplicativo (Home/Index) ou em telas curtas, o botão NUNCA é exibido.
 */
function isLongListRoute(pathname: string): boolean {
  if (!pathname || pathname === '/' || pathname === '/home' || pathname === '/inicio' || pathname === '/landing') {
    return false;
  }

  const longListPrefixes = [
    '/vade-mecum',
    '/legislacao',
    '/legislacao-estadual',
    '/blog',
    '/noticias',
    '/boletins',
    '/boletins-noticias',
    '/radar',
    '/jurisprudencia',
    '/resumos-juridicos',
    '/lei-seca',
    '/questoes',
    '/normas',
  ];

  return longListPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const isAllowed = isLongListRoute(location.pathname);

  useEffect(() => {
    if (!isAllowed) {
      setIsVisible(false);
      return;
    }

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

    handleScroll();

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
  }, [isAllowed, location.pathname]);

  if (!isAllowed) return null;

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
