import { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import {
  SocratesVideo,
  SOCRATES_DURATION_FRAMES,
  SOCRATES_FPS,
  SOCRATES_HEIGHT,
  SOCRATES_WIDTH,
} from './SocratesVideo';

type Props = {
  open: boolean;
  onFinished: () => void;
};

export default function FilosofoPresentationOverlay({ open, onFinished }: Props) {
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    if (!open) return;
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    const t = setTimeout(() => p.play(), 100);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[200] bg-black overflow-hidden flex flex-col justify-center items-center"
        >
          {/* Close Button */}
          <button
            onClick={() => { haptic.selection(); onFinished(); }}
            className="absolute top-12 right-6 z-[210] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/40 text-white shadow-xl hover:bg-white/20 active:scale-95 transition-all"
          >
            <X className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>

          {/* Player Container */}
          <div className="relative w-full h-full max-w-[1080px] mx-auto flex items-center justify-center bg-black">
            <Player
              ref={playerRef}
              component={SocratesVideo}
              durationInFrames={SOCRATES_DURATION_FRAMES}
              fps={SOCRATES_FPS}
              compositionWidth={SOCRATES_WIDTH}
              compositionHeight={SOCRATES_HEIGHT}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain' // Mantém o vídeo responsivo sem cortar nas laterais dependendo do monitor
              }}
              controls={true}
              autoPlay={false}
              loop={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
