import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X } from 'lucide-react';
import { usePilulasPlayer } from '@/contexts/PilulasPlayerContext';

export default function GlobalPilulasMiniPlayer() {
  const { livro, isPlaying, togglePlay, fechar } = usePilulasPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [navHeight, setNavHeight] = useState(0);

  useEffect(() => {
    const medir = () => {
      const nav = document.querySelector<HTMLElement>('[data-bottom-nav]');
      setNavHeight(nav ? nav.getBoundingClientRect().height : 0);
    };
    medir();

    const nav = document.querySelector<HTMLElement>('[data-bottom-nav]');
    let ro: ResizeObserver | undefined;
    if (nav && 'ResizeObserver' in window) {
      ro = new ResizeObserver(medir);
      ro.observe(nav);
    }
    window.addEventListener('resize', medir);
    const t = window.setTimeout(medir, 300);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', medir);
      window.clearTimeout(t);
    };
  }, [location.pathname]);

  const onPilulasPlayerPage = location.pathname.startsWith('/pilulas/') && location.pathname.length > 9;
  const visible = !!livro && !onPilulasPlayerPage;

  const handleReopen = () => {
    if (livro) {
      navigate(`/pilulas/${livro.id}${livro.isCP ? '?type=cp' : ''}`);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 150, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 150, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ bottom: `calc(1rem + ${navHeight}px + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))` }}
          className="fixed left-4 right-4 z-[9990] md:left-auto md:right-4 md:w-80"
        >
          {/* Sombra difusa colorida (aura) */}
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full z-0" />

          {/* Container principal (Cápsula) */}
          <div className="relative z-10 flex items-center bg-[#1A1D21]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full p-1.5 overflow-hidden">
            
            {/* Brilho superior sutil */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Imagem/Ícone do lado esquerdo - Clicável para reabrir */}
            <button
              onClick={handleReopen}
              className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-black/40 mr-3 active:scale-95 transition-transform"
              aria-label="Voltar para Pílula"
            >
              {livro.capa ? (
                <img src={livro.capa} alt={livro.titulo} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center" />
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                   <div className="w-full flex justify-center gap-0.5 items-end h-3">
                     <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                     <motion.div animate={{ height: ["70%", "30%", "70%"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-white rounded-full" />
                     <motion.div animate={{ height: ["30%", "80%", "30%"] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-white rounded-full" />
                   </div>
                </div>
              )}
            </button>

            {/* Informações Centrais - Clicável para reabrir */}
            <button
              onClick={handleReopen}
              className="flex-1 min-w-0 flex flex-col justify-center text-left"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] uppercase tracking-wider font-bold text-primary">Pílulas</span>
                {isPlaying && (
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white truncate leading-tight">
                {livro.titulo}
              </h4>
            </button>

            {/* Controles do lado direito */}
            <div className="flex items-center gap-1 shrink-0 ml-2 pr-1">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                aria-label={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              
              <button
                onClick={fechar}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Fechar player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
