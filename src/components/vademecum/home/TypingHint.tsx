import { useState, useEffect, memo } from 'react';

const HINTS = [
  'Pesquise o artigo...',
  'Pesquise a lei...',
  'Pesquise o número da lei...',
  'Pesquise trechos...',
  'Pesquise normas...',
  'Pesquise jurisprudência...',
  'Pesquise súmulas...',
  'Pesquise por voz...',
];

const STATIC_HINT = 'Pesquise leis, artigos ou súmulas...';

const TypingHint = () => {
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

    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mediaQuery.removeEventListener?.('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !isVisible) return;

    const current = HINTS[hintIndex] || HINTS[0];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 85);
      } else {
        // Pausa quando o texto está completo antes de apagar
        timer = setTimeout(() => setPhase('erasing'), 1600);
      }
    } else if (phase === 'erasing') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, text.length - 1)), 45);
      } else {
        setHintIndex((i) => (i + 1) % HINTS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timer);
  }, [text, hintIndex, phase, prefersReducedMotion, isVisible]);

  if (prefersReducedMotion) {
    return <span className="inline-flex items-center text-white/70">{STATIC_HINT}</span>;
  }

  return (
    <>
      <span className="sr-only">{STATIC_HINT}</span>
      <span className="inline-flex items-center" aria-hidden="true">
        {text}
        <span className="ml-0.5 inline-block w-[2px] h-[14px] bg-white/80 animate-pulse" />
      </span>
    </>
  );
};

export default memo(TypingHint);

