import { useEffect, useRef, useState } from 'react';
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

const ROTEIRO = [
  { frame: 10, text: "Sócrates não deixou uma única linha escrita. Soldado valente de Atenas e filósofo andante, sua missão não era dar as respostas, mas ajudar os jovens a darem à luz as suas próprias ideias." },
  { frame: 450, text: "Diferente dos sofistas, que cobravam para ensinar a retórica vazia, Sócrates andava pelas ruas em busca da verdade. Com sua famosa ironia, ele demonstrava aos intelectuais arrogantes que eles nada sabiam." },
  { frame: 900, text: "Sua guerra contra a ignorância criou inimigos letais. Acusado de corromper a juventude e de impiedade, ele foi condenado à morte. Um cálice de cicuta selaria o seu destino." },
  { frame: 1350, text: "Recusando-se a fugir para não trair as leis de sua cidade, Sócrates bebeu o veneno voluntariamente. Tornou-se o primeiro mártir do pensamento. Como ele disse: nada escrevi, mas serei lido para sempre." }
];

export default function FilosofoPresentationOverlay({ open, onFinished }: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const lastSpokenIndex = useRef(-1);

  // Auto-play e Reset
  useEffect(() => {
    if (!open) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      lastSpokenIndex.current = -1;
      return;
    }
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    const t = setTimeout(() => { p.play(); setIsPlaying(true); }, 500);
    return () => clearTimeout(t);
  }, [open]);

  // Loop de Verificação (TTS Narrator Sincronizado aos Frames)
  useEffect(() => {
    if (!open) return;
    const p = playerRef.current;
    if (!p) return;

    let raf = 0;
    const checkFrames = () => {
      const f = p.getCurrentFrame();
      const playingStatus = p.isPlaying();
      
      // Sincroniza estado de play/pause para parar a voz se pausar
      if (playingStatus !== isPlaying) {
         setIsPlaying(playingStatus);
      }

      // Se passou por um gatilho de cena novo enquanto roda, aciona o TTS
      if (playingStatus && 'speechSynthesis' in window) {
        for (let i = 0; i < ROTEIRO.length; i++) {
          if (f >= ROTEIRO[i].frame && i > lastSpokenIndex.current) {
            lastSpokenIndex.current = i;
            window.speechSynthesis.cancel(); // Para a fala anterior
            const utterance = new SpeechSynthesisUtterance(ROTEIRO[i].text);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.0; 
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        }
      }

      raf = requestAnimationFrame(checkFrames);
    };

    raf = requestAnimationFrame(checkFrames);
    return () => cancelAnimationFrame(raf);
  }, [open, isPlaying]);

  // Se o video for pausado manualmente, cancela a voz e volta os dados
  useEffect(() => {
     if (!isPlaying && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
     }
  }, [isPlaying]);

  const handleClose = () => {
    haptic.selection(); 
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    onFinished();
  };

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
            onClick={handleClose}
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
                objectFit: 'contain'
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
