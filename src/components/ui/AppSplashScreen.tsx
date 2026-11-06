import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoThemis from '@/assets/logo-coruja.png';
import splashHeroSkyColumns from '@/assets/splash-hero-sky-columns.webp';

export default function AppSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Exibe por 2 segundos e depois inicia o fadeout cinematográfico suave
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="app-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center select-none overflow-hidden touch-none"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* ======================================================== */}
          {/* FUNDO: CÉU DE ENTARDECER DO INÍCIO DO APP & PILARES     */}
          {/* ======================================================== */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
            <img
              src={splashHeroSkyColumns}
              alt="Tribunal sob céu ao entardecer"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-cover object-top opacity-75 scale-100 select-none pointer-events-none filter brightness-100 contrast-105"
            />
            {/* Gradientes cinematográficos: preserva o céu dramático no topo e escurece suavemente para preto puro na base */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,#000000_90%)]" />
            {/* Grid sutil característico do app */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0f_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
          </div>

          {/* ======================================================== */}
          {/* CONTEÚDO CENTRAL: LOGO AMPLIADO & TIPOGRAFIA OFICIAL     */}
          {/* ======================================================== */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-md w-full text-center">
            {/* Busto Themis com proporções ampliadas e detalhes nítidos */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 14 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.75,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative mb-5 flex items-center justify-center"
            >
              {/* Aura âmbar muito sutil e refinada atrás do halo dourado (sem vermelho) */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-amber-500/15 blur-2xl -z-10"
              />

              <img
                src={logoThemis}
                alt="Themis - Estudos Jurídicos"
                className="w-auto h-[145px] sm:h-[170px] object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)] drop-shadow-[0_20px_40px_rgba(0,0,0,0.98)] drop-shadow-[0_0_28px_rgba(217,119,6,0.28)] transform-gpu pointer-events-none select-none"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </motion.div>

            {/* Título Oficial: Estudos Jurídicos (Serif Itálico idêntico à Home) */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55, ease: "easeOut" }}
              className="font-serif italic text-white text-3xl sm:text-4xl font-semibold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] whitespace-nowrap"
            >
              Estudos Jurídicos
            </motion.h1>

            {/* Subtítulo: USO PROFISSIONAL (Caixa alta espaçada idêntica à Home) */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
              className="font-body text-white/95 text-[11px] sm:text-[12px] font-bold tracking-[0.28em] uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] mt-1.5"
            >
              USO PROFISSIONAL
            </motion.p>

            {/* Citação Oficial com Barra Vertical Lateral idêntica à Home */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.55, ease: "easeOut" }}
              className="mt-4 flex items-center text-left gap-2.5 justify-center"
            >
              <div className="w-0.5 h-8 bg-white/40 rounded-full" />
              <p className="font-serif italic text-white/90 text-[13px] sm:text-[14px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                Domine as leis,
                <br />
                imponha respeito.
              </p>
            </motion.div>

            {/* Barra de Progresso Fina e Elegante em Tom Dourado / Âmbar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="w-36 sm:w-44 h-0.5 bg-white/10 rounded-full overflow-hidden mt-8"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.95, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
