import { memo, useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { AULAS_CATALOGO_COMPLETO } from '@/data/aulasInterativasCatalogoCompleto';

const LOCAL_PROGRESSO_KEY = 'aulas_interativas_progresso_v1';
const RED_COLOR = '#E11D48';

const HomeAulasInterativasBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Contador para disparar a animação de reflexo sempre que entrar ou voltar para o Início
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    // Dispara logo após o carregamento/retorno
    const timer = setTimeout(() => {
      setAnimKey((prev) => prev + 1);
    }, 150);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        setAnimKey((prev) => prev + 1);
      }
    };

    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
    };
  }, [location.pathname, location.key]);

  // Verifica se o usuário tem alguma aula recente em progresso
  const aulaRecente = useMemo(() => {
    try {
      const raw = localStorage.getItem(LOCAL_PROGRESSO_KEY);
      if (!raw) return null;
      const progresso = JSON.parse(raw) as Record<string, { etapaAtual: number }>;
      const entries = Object.entries(progresso);
      if (entries.length === 0) return null;

      // Pega a última aula com progresso registrado
      const lastEntry = entries[entries.length - 1];
      const aula = AULAS_CATALOGO_COMPLETO.find((a) => a.id === lastEntry[0]);
      if (!aula) return null;

      return {
        aula,
        etapaAtual: lastEntry[1].etapaAtual || 1,
      };
    } catch {
      return null;
    }
  }, []);

  const handleClick = () => {
    haptic.selection();
    navigate('/aulas');
  };

  const displayNome = 'Aulas de Direito';
  const displaySubtitulo = 'Domine as matérias';

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      style={{
        background: `linear-gradient(to right, ${RED_COLOR}33, ${RED_COLOR}0D)`,
        borderColor: `${RED_COLOR}4D`,
      }}
      className="w-full flex items-center gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border text-left active:scale-[0.98] transition-transform overflow-hidden relative shadow-lg group cursor-pointer"
    >
      {/* Ícone principal à esquerda — Chapéu de Formatura */}
      <div className="flex items-center justify-center shrink-0 z-10">
        <GraduationCap
          className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-sm text-red-400 group-hover:scale-105 transition-transform"
          strokeWidth={1.7}
        />
      </div>

      {/* Textos informativos centrais */}
      <div className="flex-1 min-w-0 z-10">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-red-400">
          Aulas Interativas
        </p>
        <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug">
          {displayNome}
        </p>
        <p className="text-[11px] font-semibold truncate flex items-center gap-1.5 text-red-300/80">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-red-500 shrink-0" />
          <span>{displaySubtitulo}</span>
        </p>
      </div>

      {/* Seta indicativa à direita ampliada */}
      <ArrowRight
        className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 z-10 text-red-400 group-hover:translate-x-1.5 transition-transform"
        strokeWidth={2.6}
      />

      {/* Decoração de fundo — SVG translúcido no lado direito com glow vermelho */}
      <div
        className="absolute -right-3 -bottom-3 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center"
        style={{
          filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px ${RED_COLOR}40)`,
        }}
      >
        <GraduationCap
          className="w-24 h-24 opacity-25 text-red-500"
          strokeWidth={1.2}
        />
      </div>

      {/* 🌟 ANIMAÇÃO DE REFLEXO / SHIMMER LUMINOSO (Ao entrar ou voltar para o Início) */}
      <AnimatePresence>
        {animKey > 0 && (
          <>
            {/* Feixe Amplo de Reflexo Suave */}
            <motion.div
              key={`reflexo-broad-${animKey}`}
              initial={{ x: '-160%', opacity: 0 }}
              animate={{
                x: ['-160%', '350%'],
                opacity: [0, 0.85, 0.85, 0],
              }}
              transition={{
                delay: 0.25,
                duration: 1.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="pointer-events-none absolute inset-y-0 w-32 -skew-x-[25deg] bg-gradient-to-r from-transparent via-white/30 to-transparent z-20"
              style={{
                filter: 'blur(4px)',
              }}
            />

            {/* Linha Fina Brilhante de Alta Intensidade */}
            <motion.div
              key={`reflexo-sharp-${animKey}`}
              initial={{ x: '-160%', opacity: 0 }}
              animate={{
                x: ['-160%', '360%'],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                delay: 0.35,
                duration: 0.95,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="pointer-events-none absolute inset-y-0 w-10 -skew-x-[25deg] bg-gradient-to-r from-transparent via-white/80 to-transparent z-20"
            />

            {/* Pulso Luminoso no Contorno do Botão durante o Reflexo */}
            <motion.div
              key={`reflexo-border-${animKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.75, 0] }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-white/50 z-20 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            />
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default memo(HomeAulasInterativasBanner);

