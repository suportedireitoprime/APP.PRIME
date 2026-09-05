import React, { useRef, useEffect } from 'react';

// Componente para legendas dinâmicas (Remotion-style) sem re-render do React
export const AudioSubtitles = ({ 
  audioRef, 
  duration, 
  roteiro 
}: { 
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  duration: number;
  roteiro: string;
}) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  
  useEffect(() => {
    if (!roteiro) return;
    const words = roteiro.split(/\s+/).filter(Boolean);
    if (!words.length) return;
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      words.forEach((w) => {
        const span = document.createElement('span');
        span.textContent = w + ' ';
        span.className = 'transition-all duration-200 opacity-40 mx-0.5 inline-block';
        containerRef.current?.appendChild(span);
      });
    }

    let frameId: number;
    const update = () => {
      if (audioRef.current && duration > 0 && containerRef.current) {
        const ct = audioRef.current.currentTime;
        const progress = Math.min(1, Math.max(0, ct / duration));
        const targetIndex = Math.floor(progress * words.length);
        
        const children = containerRef.current.children;
        let targetEl: HTMLSpanElement | null = null;

        for (let i = 0; i < children.length; i++) {
          const el = children[i] as HTMLSpanElement;
          if (i === targetIndex) {
            el.style.opacity = '1';
            el.style.color = 'hsl(var(--primary))';
            el.style.transform = 'scale(1.15)';
            el.style.fontWeight = 'bold';
            targetEl = el;
          } else if (i < targetIndex) {
            el.style.opacity = '0.75';
            el.style.color = '#FFF';
            el.style.transform = 'scale(1)';
            el.style.fontWeight = 'normal';
          } else {
            el.style.opacity = '0.35';
            el.style.color = '#FFF';
            el.style.transform = 'scale(1)';
            el.style.fontWeight = 'normal';
          }
        }
        
        if (targetEl) {
           const offset = targetEl.offsetTop;
           containerRef.current.style.transform = `translateY(-${offset}px)`;
        }
      }
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [audioRef, duration, roteiro]);

  if (!roteiro) return null;

  return (
    <div 
      className="relative w-full h-20 overflow-hidden pointer-events-none mb-2" 
      style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }}
    >
      <p 
        ref={containerRef} 
        className="text-center font-heading text-[18px] md:text-xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] w-full px-6 absolute top-8 transition-transform duration-300 ease-out" 
      />
    </div>
  );
};
