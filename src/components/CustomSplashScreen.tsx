import { useEffect } from 'react';
import { motion } from 'framer-motion';

export function CustomSplashScreen({ onComplete }: { onComplete: () => void }) {
  const text = "Estudos Jurídicos";

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onComplete();
    };

    // Permanece na tela por 3 segundos para carregamento dos recursos iniciais
    const splashTimeout = setTimeout(finish, 3000);

    return () => {
      clearTimeout(splashTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.035, 
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } 
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0D0D0D] overflow-hidden select-none will-change-[transform,opacity]"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Iluminação de fundo estética e estática (0ms de custo de renderização contínua na GPU) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.18),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.8),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Estilos CSS puros para animação acelerada via GPU Compositor Thread (120fps constante) */}
      <style>{`
        @keyframes splash-logo-anim {
          0% { transform: scale(0.65); opacity: 0; }
          60% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splash-content-anim {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .anim-splash-logo-gpu {
          animation: splash-logo-anim 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
          transform: translateZ(0);
        }
        .anim-splash-content-gpu {
          opacity: 0;
          animation: splash-content-anim 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.25s;
          will-change: transform, opacity;
          transform: translateZ(0);
        }
      `}</style>

      {/* Logo Central com aceleração de hardware */}
      <div className="mb-6 relative z-10 flex flex-col items-center anim-splash-logo-gpu">
        <img
          src="/logo-prime.png"
          alt="Direito Prime"
          className="w-36 h-36 sm:w-44 sm:h-44 object-contain"
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      
      {/* Título e Subtítulo surgindo JUNTOS de forma sincronizada */}
      <div className="flex flex-col items-center relative z-10 px-4 anim-splash-content-gpu">
        <div className="flex items-center justify-center relative">
          <span 
            className="text-white font-serif italic text-3xl sm:text-5xl font-semibold tracking-tight text-center relative flex"
            style={{ textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}
          >
            {text}
          </span>
        </div>
        <div className="mt-2.5">
          <span className="text-white/80 font-sans text-xs sm:text-sm font-bold tracking-[0.28em] uppercase">
            Uso Profissional
          </span>
        </div>
      </div>
    </motion.div>
  );
}
