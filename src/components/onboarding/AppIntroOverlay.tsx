import { useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import horusOwlAsset from '@/assets/horus/horus-owl.png.asset.json';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import { pickAsset, srcOf } from '@/lib/assetUrl';
import {
  AppIntroVideo,
  APP_INTRO_DURATION,
  APP_INTRO_FPS,
  APP_INTRO_HEIGHT,
  APP_INTRO_WIDTH,
  type AppIntroProps,
} from './AppIntroVideo';
import { haptic } from '@/lib/nativeHaptics';

type Props = {
  open: boolean;
  onFinished: () => void;
  nome: string;
  previewMode?: boolean;
};

const owlSrc = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

export default function AppIntroOverlay({
  open,
  onFinished,
  nome,
  previewMode = false,
}: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(false);

  const inputProps: AppIntroProps = useMemo(
    () => ({ owlSrc, nome: nome || 'você' }),
    [nome]
  );

  useEffect(() => {
    if (!open) {
      setPlaying(false);
      return;
    }
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    // delay to let seekTo commit before playing
    const t = setTimeout(() => {
      p.play();
      setPlaying(true);
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  // Track frames to auto-finish when video ends
  useEffect(() => {
    if (!open || !playing) return;
    const p = playerRef.current;
    if (!p) return;
    let raf = 0;
    const check = () => {
      const f = p.getCurrentFrame();
      if (f >= APP_INTRO_DURATION - 2) {
        setPlaying(false);
        onFinished();
        return;
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [open, playing, onFinished]);

  function handleSkip() {
    haptic.selection();
    onFinished();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="app-intro"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[100] bg-black"
        style={{ paddingTop: 'var(--sai-top)' }}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          aria-label="Pular apresentação"
          className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition"
          style={{ marginTop: 'var(--sai-top)' }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Player container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full max-w-[520px] mx-auto">
            <Player
              ref={playerRef}
              component={AppIntroVideo}
              inputProps={inputProps}
              durationInFrames={APP_INTRO_DURATION}
              fps={APP_INTRO_FPS}
              compositionWidth={APP_INTRO_WIDTH}
              compositionHeight={APP_INTRO_HEIGHT}
              style={{ width: '100%', height: '100%' }}
              controls={false}
              clickToPlay={false}
              doubleClickToFullscreen={false}
              autoPlay={false}
              loop={false}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
