import { useEffect, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

import {
  SocratesVideo,
  SOCRATES_DURATION_FRAMES,
  SOCRATES_FPS,
  SOCRATES_HEIGHT,
  SOCRATES_WIDTH,
} from './SocratesVideo';

import {
  PlataoVideo,
  PLATAO_DURATION_FRAMES,
  PLATAO_FPS,
  PLATAO_HEIGHT,
  PLATAO_WIDTH,
} from './PlataoVideo';

import {
  AristotelesVideo,
  ARISTOTELES_DURATION_FRAMES,
  ARISTOTELES_FPS,
  ARISTOTELES_HEIGHT,
  ARISTOTELES_WIDTH,
} from './AristotelesVideo';

type Props = {
  open: boolean;
  personagemId?: string;
  customAudioUrl?: string;
  version?: number;
  onFinished: () => void;
};

import { SOCRATES_ROTEIROS, PLATAO_ROTEIROS, ARISTOTELES_ROTEIROS } from './roteiros';

const VIDEO_CONFIGS: Record<string, { component: React.FC; durationInFrames: number; fps: number; width: number; height: number; getRoteiro: (v: number) => Array<{frame: number; text: string}> }> = {
  socrates: {
    component: SocratesVideo,
    durationInFrames: SOCRATES_DURATION_FRAMES,
    fps: SOCRATES_FPS,
    width: SOCRATES_WIDTH,
    height: SOCRATES_HEIGHT,
    getRoteiro: (v) => SOCRATES_ROTEIROS[v] || SOCRATES_ROTEIROS[1],
  },
  platao: {
    component: PlataoVideo,
    durationInFrames: PLATAO_DURATION_FRAMES,
    fps: PLATAO_FPS,
    width: PLATAO_WIDTH,
    height: PLATAO_HEIGHT,
    getRoteiro: (v) => PLATAO_ROTEIROS[v] || PLATAO_ROTEIROS[1],
  },
  aristoteles: {
    component: AristotelesVideo,
    durationInFrames: ARISTOTELES_DURATION_FRAMES,
    fps: ARISTOTELES_FPS,
    width: ARISTOTELES_WIDTH,
    height: ARISTOTELES_HEIGHT,
    getRoteiro: (v) => ARISTOTELES_ROTEIROS[v] || ARISTOTELES_ROTEIROS[1],
  }
};

export default function FilosofoPresentationOverlay({ open, personagemId, customAudioUrl, version = 1, onFinished }: Props) {
  const config = VIDEO_CONFIGS[personagemId || 'socrates'] || VIDEO_CONFIGS['socrates'];
  const roteiro = config.getRoteiro(version);
  const totalDuration = roteiro.length > 0 ? roteiro[roteiro.length - 1].frame + roteiro[roteiro.length - 1].duration : config.durationInFrames;

  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const lastSpokenIndex = useRef(-1);
  const lastSceneIndex = useRef(-1);

  // Auto-play e Reset
  useEffect(() => {
    if (!open) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      lastSpokenIndex.current = -1;
      lastSceneIndex.current = -1;
      return;
    }
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(0);
    const t = setTimeout(() => { p.play(); setIsPlaying(true); }, 500);
    return () => clearTimeout(t);
  }, [open]);

  // Loop de Verificação (TTS Narrator Sincronizado aos Frames e Haptics)
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

        // Logica 1: Haptic Feedback Rítmico de Mudança de Cena (Dinâmico)
        let currentSceneIndex = 0;
        for (let i = 0; i < roteiro.length; i++) {
          if (f >= roteiro[i].frame) currentSceneIndex = i;
        }

        if (currentSceneIndex > lastSceneIndex.current && f > 0) {
          lastSceneIndex.current = currentSceneIndex;
          
          // As cenas 6 (idx 5), 11 (idx 10) e 14 (idx 13) são Timelines em todos os roteiros
          const isTimeline = [5, 10, 13].includes(currentSceneIndex);
          if (isTimeline) {
            haptic.heavy();
          } else {
            haptic.selection();
          }
        }

        // Lógica 2: TTS Sincronizado com os "Hooks" (Gatilhos de texto)
        for (let i = 0; i < roteiro.length; i++) {
          if (f >= roteiro[i].frame && i > lastSpokenIndex.current) {
            lastSpokenIndex.current = i;
            
            // Se o usuário fez upload de áudio customizado, o TTS Nativo fica mudo
            if (customAudioUrl) continue;

            const ttsText = roteiro[i].text;
            
            if (Capacitor.isNativePlatform()) {
              TextToSpeech.stop().then(() => {
                TextToSpeech.speak({
                  text: ttsText,
                  lang: 'pt-BR',
                  rate: 1.15, 
                  pitch: 1.0,
                }).catch(e => console.error("TTS Native Error:", e));
              });
            } else if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(ttsText);
              utterance.lang = 'pt-BR';
              utterance.rate = 1.15; 
              utterance.pitch = 1.0;
              window.speechSynthesis.speak(utterance);
            }
          }
        }

      raf = requestAnimationFrame(checkFrames);
    };

    raf = requestAnimationFrame(checkFrames);
    return () => cancelAnimationFrame(raf);
  }, [open, isPlaying, config, version]); // dependência adicionada

  // Se o video for pausado manualmente, cancela a voz
  useEffect(() => {
     if (!isPlaying) {
        if (Capacitor.isNativePlatform()) {
           TextToSpeech.stop().catch(console.error);
        } else if ('speechSynthesis' in window) {
           window.speechSynthesis.cancel();
        }
     }
  }, [isPlaying]);

  const handleClose = () => {
    haptic.selection(); 
    if (Capacitor.isNativePlatform()) {
       TextToSpeech.stop().catch(console.error);
    } else if ('speechSynthesis' in window) {
       window.speechSynthesis.cancel();
    }
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
              component={config.component}
              durationInFrames={totalDuration}
              fps={config.fps}
              compositionWidth={config.width}
              compositionHeight={config.height}
              inputProps={{ customAudioUrl, version, roteiro: config.getRoteiro(version) }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              controls={true}
              autoPlay={false}
              loop={false}
              clickToPlay={true}
            />

            {/* Big Play Button Overlay */}
            {!isPlaying && (
              <button
                onClick={() => {
                  playerRef.current?.play();
                  setIsPlaying(true);
                  haptic.selection();
                }}
                className="absolute inset-0 z-[205] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-all"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-white/30 transition-all">
                   <div className="w-0 h-0 border-t-[20px] border-t-transparent border-l-[35px] border-l-white border-b-[20px] border-b-transparent ml-3 drop-shadow-xl" />
                </div>
                <span className="mt-6 text-white font-bold tracking-widest uppercase text-xl drop-shadow-md">Tocar Documentário</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
