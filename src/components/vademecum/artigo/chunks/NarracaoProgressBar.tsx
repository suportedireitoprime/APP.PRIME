import React from 'react';
import { Pause } from 'lucide-react';

interface NarracaoProgressBarProps {
  narracaoPlaying: boolean;
  handleNarrarButtonPress: (e?: React.SyntheticEvent<HTMLButtonElement>) => void;
  narracaoAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  narracaoProgressFillRef: React.RefObject<HTMLDivElement>;
  narracaoTimeRef: React.RefObject<HTMLSpanElement>;
  narracaoTotalTimeRef: React.RefObject<HTMLSpanElement>;
  narracaoActiveIdxRef: React.MutableRefObject<number>;
}

export const NarracaoProgressBar = ({
  narracaoPlaying,
  handleNarrarButtonPress,
  narracaoAudioRef,
  narracaoProgressFillRef,
  narracaoTimeRef,
  narracaoTotalTimeRef,
  narracaoActiveIdxRef,
}: NarracaoProgressBarProps) => {
  if (!narracaoPlaying) return null;

  return (
    <div className="sticky top-0 z-30 -mx-5 -mt-4 mb-3 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/5 px-5 py-2.5">
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleNarrarButtonPress}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-colors"
          aria-label="Pausar narração"
        >
          <Pause className="w-3.5 h-3.5 text-primary-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div
            className="h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer"
            onClick={(e) => {
              const audio = narracaoAudioRef.current;
              if (!audio || !audio.duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              audio.currentTime = pct * audio.duration;
              narracaoActiveIdxRef.current = -1;
            }}
          >
            <div
              ref={narracaoProgressFillRef}
              className="h-full bg-gradient-to-r from-primary to-primary-light transition-[width] duration-100 ease-out"
              style={{ width: '0%' }}
            />
          </div>
        </div>
        <div className="flex-shrink-0 text-[10.5px] font-mono text-foreground/70 tabular-nums">
          <span ref={narracaoTimeRef}>0:00</span>
          <span className="text-foreground/40"> / </span>
          <span ref={narracaoTotalTimeRef}>0:00</span>
        </div>
      </div>
    </div>
  );
};
