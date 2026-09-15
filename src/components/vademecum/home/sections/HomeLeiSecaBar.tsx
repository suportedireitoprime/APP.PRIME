import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

const LEI_SECA_HINTS = [
  'Pratique a Constituição Federal...',
  'Pratique o Código Penal...',
  'Pratique o Código Civil...',
  'Pratique o Processo Penal e CPC...',
  'Pratique a CLT e Legislação...',
  'Artigos comentados e simulados...',
];

const STATIC_HINT = 'Artigos comentados e simulados...';

const TypingLeiSecaHint = memo(() => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [text, setText] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'erasing'>('typing');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener?.('change', handleMotionChange);

    const handleVisibility = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mediaQuery.removeEventListener?.('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !isVisible) return;

    const current = LEI_SECA_HINTS[hintIndex] || LEI_SECA_HINTS[0];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 75);
      } else {
        timer = setTimeout(() => setPhase('erasing'), 1800);
      }
    } else if (phase === 'erasing') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, text.length - 1)), 35);
      } else {
        setHintIndex((i) => (i + 1) % LEI_SECA_HINTS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timer);
  }, [text, hintIndex, phase, prefersReducedMotion, isVisible]);

  if (prefersReducedMotion) {
    return <span className="text-white/70">{STATIC_HINT}</span>;
  }

  return (
    <>
      <span className="sr-only">{STATIC_HINT}</span>
      <span className="inline-flex items-center text-white/75" aria-hidden="true">
        {text}
        <span className="ml-0.5 inline-block w-[2px] h-[12px] bg-primary animate-pulse" />
      </span>
    </>
  );
});

TypingLeiSecaHint.displayName = 'TypingLeiSecaHint';

const HomeLeiSecaBar = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    try { haptic.selection(); } catch {}
    navigate('/lei-seca');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      role="button"
      aria-label="Praticar Lei Seca. Abra artigos comentados, pílulas e simulados."
      className="group relative w-full flex items-center justify-between gap-3 sm:gap-4 h-[76px] sm:h-[84px] md:h-[88px] px-4 sm:px-5 rounded-2xl bg-[#252528] hover:bg-[#2E2E33] backdrop-blur-md border border-white/10 shadow-lg shadow-black/30 active:scale-[0.99] transition-all cursor-pointer overflow-hidden lei-seca-sweep-shine text-left"
    >
      {/* Lado Esquerdo: Ícone + Textos com flexbox (sem risco de colisão) */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1 relative z-10">
        {/* Ícone da Balança da Justiça com proporção confortável */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
          <Scale
            className="w-8 h-8 sm:w-[32px] sm:h-[32px] text-primary shrink-0 group-hover:scale-105 transition-transform"
            strokeWidth={1.3}
          />
        </div>

        {/* Textos: Título chamativo e subtítulo com efeito digitando */}
        <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
          <span className="font-display text-white text-[14.5px] sm:text-[16px] font-bold uppercase tracking-wider leading-snug truncate w-full">
            Praticar Lei Seca
          </span>
          <span className="font-body text-white/70 text-[11.5px] sm:text-[13px] font-medium truncate flex items-center leading-tight mt-1 w-full">
            <TypingLeiSecaHint />
          </span>
        </div>
      </div>

      {/* Lado Direito: Botão 'PRATICAR >' em vermelho com alto apelo de clique */}
      <div
        aria-hidden="true"
        className="relative z-10 shrink-0 h-11 sm:h-12 px-4 sm:px-5 rounded-xl bg-primary hover:bg-[#BE123C] text-white font-display text-[12.5px] sm:text-[13.5px] font-black tracking-wider flex items-center justify-center gap-1 shadow-md shadow-primary/30 group-hover:shadow-primary/50 group-hover:scale-[1.02] transition-all select-none uppercase"
      >
        <span>PRATICAR</span>
        <ChevronRight className="w-4 h-4 stroke-[2.8] transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};

export default memo(HomeLeiSecaBar);
