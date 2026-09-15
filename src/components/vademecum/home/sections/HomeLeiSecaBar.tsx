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
    return <span className="text-white/85">{STATIC_HINT}</span>;
  }

  return (
    <>
      <span className="sr-only">{STATIC_HINT}</span>
      <span className="inline-flex items-center text-white/95 drop-shadow-sm" aria-hidden="true">
        {text}
        <span className="ml-1 inline-block w-[2px] h-[12px] bg-white animate-pulse" />
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
      className="group relative w-full flex items-center h-[68px] sm:h-[74px] pl-13 sm:pl-15 pr-[118px] sm:pr-[132px] rounded-2xl bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#BE123C] hover:from-[#881337] hover:via-[#9F1239] hover:to-[#E11D48] border border-rose-300/30 hover:border-white/40 shadow-xl shadow-rose-950/45 hover:shadow-rose-900/60 active:scale-[0.99] transition-all cursor-pointer overflow-hidden search-bar-shine text-left"
    >
      {/* Linha de reflexo especular superior */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Brilho radial e iluminação suave de fundo */}
      <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/15 blur-2xl pointer-events-none group-hover:bg-white/25 transition-colors" />
      <div className="absolute right-20 top-0 w-24 h-full bg-white/5 skew-x-12 blur-md pointer-events-none" />

      {/* Ícone fino da Balança da Justiça em branco puro com drop-shadow */}
      <Scale
        className="absolute left-4 sm:left-4.5 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-6 sm:h-6 text-white shrink-0 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] group-hover:scale-110 transition-transform"
        strokeWidth={2}
      />

      {/* Textos: Título chamativo e subtítulo com digitação dinâmica */}
      <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden pr-2">
        <span className="font-display text-white text-[14px] sm:text-[15.5px] font-black uppercase tracking-wider leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] truncate">
          Praticar Lei Seca
        </span>
        <span className="font-body text-rose-100 text-[11.5px] sm:text-[12.5px] font-medium truncate flex items-center leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          <TypingLeiSecaHint />
        </span>
      </div>

      {/* Botão de Ação Lateral 'PRATICAR >' em branco puro com alto contraste */}
      <div
        aria-hidden="true"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 sm:h-11 px-4 sm:px-4.5 rounded-xl bg-white hover:bg-rose-50 text-[#881337] font-display text-[12px] sm:text-[13px] font-black tracking-wider flex items-center justify-center gap-1 shadow-lg shadow-black/25 group-hover:scale-[1.03] group-hover:shadow-xl transition-all select-none uppercase shrink-0"
      >
        <span>PRATICAR</span>
        <ChevronRight className="w-4 h-4 stroke-[3] text-[#881337] transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};

export default memo(HomeLeiSecaBar);
