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
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 80);
      } else {
        timer = setTimeout(() => setPhase('erasing'), 1800);
      }
    } else if (phase === 'erasing') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, text.length - 1)), 40);
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
      <span className="inline-flex items-center" aria-hidden="true">
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
      className="group relative w-full flex items-center h-16 sm:h-[66px] pl-12 sm:pl-14 pr-[108px] sm:pr-[120px] rounded-2xl bg-[#252528] hover:bg-[#2E2E33] backdrop-blur-md border border-white/10 shadow-lg shadow-black/30 active:scale-[0.99] transition-all cursor-pointer overflow-hidden search-bar-shine text-left"
    >
      {/* Glow e iluminação suave de fundo */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/20 blur-xl pointer-events-none group-hover:bg-primary/30 transition-colors" />

      {/* Ícone fino da Balança da Justiça (sem caixa/fundo vermelho) */}
      <Scale
        className="absolute left-4 sm:left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0 pointer-events-none drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]"
        strokeWidth={1.8}
      />

      {/* Texto principal chamativo e subtítulo com efeito digitando */}
      <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden pr-2">
        <span className="font-display text-white text-[13.5px] sm:text-[15px] font-bold uppercase tracking-wider leading-snug truncate">
          Praticar Lei Seca
        </span>
        <span className="font-body text-white/70 text-[11px] sm:text-[12.5px] font-medium truncate flex items-center leading-tight mt-0.5">
          <TypingLeiSecaHint />
        </span>
      </div>

      {/* Botão de Ação Lateral 'PRATICAR >' */}
      <div
        aria-hidden="true"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 sm:h-11 px-3.5 sm:px-4 rounded-xl bg-primary hover:bg-[#BE123C] text-white font-display text-[12px] sm:text-[13px] font-bold tracking-wider flex items-center justify-center gap-1 shadow-md shadow-primary/30 group-hover:shadow-primary/50 transition-all select-none uppercase shrink-0"
      >
        <span>PRATICAR</span>
        <ChevronRight className="w-4 h-4 stroke-[2.6] transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};

export default memo(HomeLeiSecaBar);
