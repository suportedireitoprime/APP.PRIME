import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Scale, BookOpen, GraduationCap } from 'lucide-react';
import laurel from '@/assets/landing-tribunal/laurel-leaf.png';
import scales from '@/assets/landing-tribunal/scales.png';

export function CustomSplashScreen({ onComplete }: { onComplete: () => void }) {
  const text = "Estudos Jurídicos";
  const [typed, setTyped] = useState("");
  // Aumentando o número de folhas caindo
  const fallingLeaves = Array.from({ length: 24 }, (_, i) => i);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0;
    const interval = setInterval(() => {
      setTyped(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 80);

    const timeout = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-hero-panel overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.5),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* SVGs Flutuantes (Pretos, fundo) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
        <Landmark className="absolute left-[15%] top-[8%] w-24 h-24 text-black/10 lp-float" style={{ animationDuration: '8s' }} />
        <Scale className="absolute right-[20%] top-[30%] w-32 h-32 text-black/10 lp-float" style={{ animationDirection: 'reverse', animationDuration: '10s' }} />
        <BookOpen className="absolute left-[10%] bottom-[25%] w-20 h-20 text-black/10 lp-float" style={{ animationDelay: '1s', animationDuration: '7s' }} />
        <GraduationCap className="absolute right-[12%] bottom-[15%] w-28 h-28 text-black/10 lp-float" style={{ animationDirection: 'reverse', animationDelay: '2s', animationDuration: '9s' }} />
        <Landmark className="absolute right-[5%] top-[5%] w-16 h-16 text-black/10 lp-float" style={{ animationDelay: '3s', animationDuration: '6s' }} />
      </div>

      {/* Folhas de louro caindo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[2]">
        {fallingLeaves.map((i) => (
          <img
            key={`leaf-${i}`}
            src={laurel}
            alt=""
            aria-hidden="true"
            className="absolute -top-10 lp-fall"
            style={{
              left: `${(i * 9 + 3) % 100}%`,
              width: `${14 + (i % 4) * 8}px`,
              animationDuration: reduceMotion.current ? '0s' : `${10 + (i % 4) * 3}s`,
              animationDelay: `${i * 0.8}s`,
              opacity: 0.65,
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
            }}
          />
        ))}
      </div>

      {/* Balanças e louros (originais) flutuantes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[2]">
        <img
          src={laurel}
          alt=""
          aria-hidden="true"
          className="absolute left-[5%] top-[12%] w-12 sm:w-16 lp-float"
          style={{ opacity: 0.6, animationDuration: '6s' }}
        />
        <img
          src={scales}
          alt=""
          aria-hidden="true"
          className="absolute right-[8%] top-[18%] w-14 sm:w-20 lp-float"
          style={{
            animationDirection: 'reverse',
            animationDuration: '7s',
            opacity: 0.6,
            filter: 'drop-shadow(0 0 12px hsl(var(--primary) / 0.4))',
          }}
        />
        <img
          src={scales}
          alt=""
          aria-hidden="true"
          className="absolute bottom-[20%] left-[10%] w-12 sm:w-16 lp-float"
          style={{
            animationDelay: '1.5s',
            animationDuration: '6.5s',
            opacity: 0.4,
          }}
        />
      </div>

      {/* Logo Central */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.8
        }}
        className="mb-8 relative z-10 flex flex-col items-center"
      >
        <img
          src="/logo-prime.png"
          alt="Direito Prime"
          className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
          decoding="async"
        />
      </motion.div>
      
      {/* Textos */}
      <div className="flex flex-col items-center relative z-10 overflow-hidden px-4">
        <div className="h-14 flex items-center justify-center relative">
          <span 
            className={`text-white font-serif italic text-[36px] sm:text-5xl font-semibold tracking-tight drop-shadow-lg text-center relative ${typed === text ? 'text-shimmer' : ''}`}
            style={typed === text ? { animationIterationCount: 'infinite', animationDuration: '3s' } : {}}
          >
            {typed}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="ml-[2px] inline-block text-white"
            >
              |
            </motion.span>
          </span>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: typed.length === text.length ? 1 : 0, y: typed.length === text.length ? 0 : 10 }}
          transition={{ duration: 0.4 }}
          className="mt-3"
        >
          <span className="text-white/90 font-sans text-xs sm:text-sm font-bold tracking-[0.25em] uppercase">
            Uso Profissional
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

