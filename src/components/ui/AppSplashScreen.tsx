import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import primeLogoAsset from '@/assets/logo-direitoprime-v2.webp.asset.json';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const primeLogo = pickAsset(primeLogoBundled, srcOf(primeLogoAsset));

export default function AppSplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Exibe por exatamente 2 segundos e depois inicia o fadeout suave
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
          className="fixed inset-0 z-[999999] bg-[#0D0D0D] flex flex-col items-center justify-center select-none overflow-hidden touch-none"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* Fundo Premium: Gradiente Radial e Luz Ambiente Cinematográfica */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[340px] sm:h-[480px] rounded-full bg-gradient-to-tr from-[#E11D48]/20 via-[#B91C1C]/10 to-amber-500/10 blur-[90px] opacity-80" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
          </div>

          {/* Conteúdo Central Animado */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-md w-full text-center">
            {/* Logo do Aplicativo com Animação de Entrada e Brilho Pulsante */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 15 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative mb-6"
            >
              {/* Halo sutil atrás do logo */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.35, 0.65, 0.35],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-[#E11D48]/30 blur-2xl -z-10"
              />

              <img
                src={primeLogo}
                alt="Logo Direito Prime"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_25px_rgba(225,29,72,0.45)]"
                loading="eager"
                decoding="async"
              />
            </motion.div>

            {/* Tag / Badge: USO PROFISSIONAL */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] mb-3"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-amber-300">
                USO PROFISSIONAL
              </span>
            </motion.div>

            {/* Título: ESTUDOS JURÍDICOS */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
              className="font-display text-2xl sm:text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            >
              ESTUDOS JURÍDICOS
            </motion.h1>

            {/* Subtítulo: DOMINE AS LEIS, IMPONHA RESPEITO */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
              className="font-sans text-[11px] sm:text-[12.5px] font-semibold uppercase tracking-[0.22em] text-zinc-400 mt-2 max-w-xs leading-relaxed"
            >
              Domine as leis, imponha respeito
            </motion.p>

            {/* Barra de Progresso Fina de 2 Segundos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="w-36 sm:w-44 h-1 bg-white/10 rounded-full overflow-hidden mt-7"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.95, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-[#E11D48] via-rose-500 to-amber-400 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.8)]"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
