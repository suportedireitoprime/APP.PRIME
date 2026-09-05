import { useState, useEffect, memo } from 'react';

export const HINTS = [
  'Pesquise o artigo...',
  'Pesquise a lei...',
  'Pesquise o número da lei...',
  'Pesquise trechos...',
  'Pesquise normas...',
  'Pesquise jurisprudência...',
  'Pesquise súmulas...',
  'Pesquise por voz...',
];

const TypingHint = () => {
  const [text, setText] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'paused' | 'erasing'>('typing');

  useEffect(() => {
    const current = HINTS[hintIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 90);
      } else {
        timer = setTimeout(() => setPhase('paused'), 1500);
      }
    } else if (phase === 'paused') {
      timer = setTimeout(() => setPhase('erasing'), 100);
    } else if (phase === 'erasing') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, text.length - 1)), 50);
      } else {
        setHintIndex((i) => (i + 1) % HINTS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timer);
  }, [text, hintIndex, phase]);

  return (
    <span className="inline-flex items-center">
      {text}
      <span className="ml-0.5 inline-block w-[2px] h-[14px] bg-white/80 animate-pulse" />
    </span>
  );
};

export default memo(TypingHint);
