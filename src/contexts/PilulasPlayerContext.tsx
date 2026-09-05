import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { clearMediaSession, registrarMidia } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import { type LivroNormalizado } from '@/lib/bibliotecaColecoes';

const INTRO_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/audio-intro-2.mp3';

interface PilulasPlayerContextType {
  livro: LivroNormalizado | null;
  isPlaying: boolean;
  progress: number;
  introDuration: number;
  mainDuration: number;
  phase: 'intro' | 'main';
  unifiedDuration: number;
  introOverlap: number;
  audioIntroRef: React.RefObject<HTMLAudioElement>;
  audioMainRef: React.RefObject<HTMLAudioElement>;
  tocar: (l: LivroNormalizado) => void;
  togglePlay: () => void;
  handleSeek: (newUnifiedTime: number) => void;
  fechar: () => void;
}

const fallbackRef: React.RefObject<HTMLAudioElement> = { current: null };

const fallbackPilulasContext: PilulasPlayerContextType = {
  livro: null,
  isPlaying: false,
  progress: 0,
  introDuration: 0,
  mainDuration: 0,
  phase: 'intro',
  unifiedDuration: 0,
  introOverlap: 0,
  audioIntroRef: fallbackRef,
  audioMainRef: fallbackRef,
  tocar: () => {},
  togglePlay: () => {},
  handleSeek: () => {},
  fechar: () => {}
};

const Ctx = createContext<PilulasPlayerContextType | undefined>(undefined);

export function usePilulasPlayer() {
  const ctx = useContext(Ctx);
  return ctx ?? fallbackPilulasContext;
}

export const PilulasPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [livro, setLivro] = useState<LivroNormalizado | null>(null);
  
  const audioIntroRef = useRef<HTMLAudioElement>(null);
  const audioMainRef = useRef<HTMLAudioElement>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [introDuration, setIntroDuration] = useState(0);
  const [mainDuration, setMainDuration] = useState(0);
  
  const [phase, setPhase] = useState<'intro' | 'main'>('intro');
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  const introOverlap = Math.max(0, introDuration - 0.5);
  const unifiedDuration = (introDuration > 0 && mainDuration > 0) ? (introOverlap + mainDuration) : (introDuration || mainDuration || 0);

  const clearFadeInterval = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const clearAutoPlayTimeout = useCallback(() => {
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
      autoPlayTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    void telaAcesa('pilulas', isPlaying);
    return () => { void telaAcesa('pilulas', false); };
  }, [isPlaying]);

  useEffect(() => {
    const el = audioMainRef.current;
    if (!el || !livro) return;
    registrarMidia({
      titulo: livro.titulo,
      subtitulo: livro.autor || 'Pílula de Áudio',
      album: 'Pílulas',
      capaUrl: livro.capa || '',
      audio: el,
      onStop: () => {
        el.pause();
        setIsPlaying(false);
      },
    });
  }, [livro]);

  // Limpeza de intervalos e timeouts ao desmontar
  useEffect(() => {
    return () => {
      clearFadeInterval();
      clearAutoPlayTimeout();
    };
  }, [clearFadeInterval, clearAutoPlayTimeout]);

  const skipToMain = useCallback(() => {
    if (hasPlayedIntro) return;
    
    setPhase('main');
    setHasPlayedIntro(true);
    if (audioMainRef.current) {
      if (audioMainRef.current.duration && !isNaN(audioMainRef.current.duration)) {
        setMainDuration(audioMainRef.current.duration);
      }
      
      clearFadeInterval();
      audioMainRef.current.volume = 0;
      audioMainRef.current.play().then(() => {
        setIsPlaying(true);
        let vol = 0;
        fadeIntervalRef.current = setInterval(() => {
          vol += 0.05;
          if (vol >= 1) {
            vol = 1;
            clearFadeInterval();
          }
          if (audioMainRef.current) {
            audioMainRef.current.volume = vol;
          }
        }, 50);
      }).catch(() => setIsPlaying(false));
    }
  }, [hasPlayedIntro, clearFadeInterval]);

  const tocar = useCallback((l: LivroNormalizado) => {
    if (livro?.id === l.id && (phase === 'main' || hasPlayedIntro)) {
      return;
    }

    clearFadeInterval();
    clearAutoPlayTimeout();
    
    React.startTransition(() => {
      setLivro(l);
      setIsPlaying(false);
      setProgress(0);
      setIntroDuration(0);
      setMainDuration(0);
      setPhase('intro');
      setHasPlayedIntro(false);
    });

    if (audioMainRef.current) {
      audioMainRef.current.pause();
      audioMainRef.current.currentTime = 0;
      audioMainRef.current.load();
    }
    if (audioIntroRef.current) {
      audioIntroRef.current.pause();
      audioIntroRef.current.currentTime = 0;
      audioIntroRef.current.load();
    }

    // Auto-play attempt
    autoPlayTimeoutRef.current = setTimeout(() => {
      const introEl = audioIntroRef.current;
      if (introEl) {
        introEl.play().then(() => setIsPlaying(true)).catch(err => {
          console.warn('Autoplay bloqueado', err);
          skipToMain();
        });
      } else {
        skipToMain();
      }
    }, 150);
  }, [livro, phase, hasPlayedIntro, skipToMain, clearFadeInterval, clearAutoPlayTimeout]);

  const togglePlay = useCallback(() => {
    const activeRef = phase === 'intro' ? audioIntroRef : audioMainRef;
    if (isPlaying) {
      activeRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (phase === 'intro' && !hasPlayedIntro) {
        const introEl = audioIntroRef.current;
        if (introEl) {
          introEl.play().then(() => setIsPlaying(true)).catch((err) => {
            console.warn('Intro falhou, pulando para main:', err);
            skipToMain();
          });
        }
      } else {
        const mainEl = audioMainRef.current;
        if (mainEl) {
          mainEl.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
        }
      }
    }
  }, [isPlaying, phase, hasPlayedIntro, skipToMain]);

  const handleTimeUpdate = useCallback(() => {
    const activeRef = phase === 'intro' ? audioIntroRef : audioMainRef;
    const el = activeRef.current;
    if (el) {
      if (phase === 'intro') {
        setProgress(el.currentTime);
      } else {
        setProgress(introOverlap + el.currentTime);
      }
      
      if (phase === 'intro' && !hasPlayedIntro) {
        if (el.duration > 0 && el.currentTime >= el.duration - 0.5) {
          skipToMain();
        }
      }
      
      if (phase === 'main' && livro?.id && mainDuration > 0) {
        localStorage.setItem(`pilula_progress_${livro.id}`, String(el.currentTime / mainDuration));
      }
    }
  }, [phase, hasPlayedIntro, introOverlap, livro?.id, mainDuration, skipToMain]);

  const handleSeek = useCallback((newUnifiedTime: number) => {
    const target = Math.max(0, Math.min(newUnifiedTime, unifiedDuration));

    if (target < introOverlap) {
      if (phase === 'main') {
        audioMainRef.current?.pause();
        setPhase('intro');
        setHasPlayedIntro(false);
      }
      if (audioIntroRef.current) {
        audioIntroRef.current.currentTime = target;
        setProgress(target);
        if (isPlaying) audioIntroRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      if (phase === 'intro') {
        audioIntroRef.current?.pause();
        setPhase('main');
        setHasPlayedIntro(true);
      }
      if (audioMainRef.current) {
        audioMainRef.current.currentTime = target - introOverlap;
        setProgress(target);
        if (isPlaying) {
          audioMainRef.current.volume = 1;
          audioMainRef.current.play().catch(() => setIsPlaying(false));
        }
      }
    }
  }, [unifiedDuration, introOverlap, phase, isPlaying]);

  const fechar = useCallback(() => {
    clearFadeInterval();
    clearAutoPlayTimeout();
    if (audioMainRef.current) {
      audioMainRef.current.pause();
      clearMediaSession(audioMainRef.current);
    }
    if (audioIntroRef.current) {
      audioIntroRef.current.pause();
    }
    setIsPlaying(false);
    setLivro(null);
  }, [clearFadeInterval, clearAutoPlayTimeout]);

  const value: PilulasPlayerContextType = {
    livro,
    isPlaying,
    progress,
    introDuration,
    mainDuration,
    phase,
    unifiedDuration,
    introOverlap,
    audioIntroRef,
    audioMainRef,
    tocar,
    togglePlay,
    handleSeek,
    fechar
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {livro && phase === 'intro' && (
        <audio
          ref={audioIntroRef}
          src={INTRO_URL}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (audioIntroRef.current) setIntroDuration(audioIntroRef.current.duration);
          }}
          onEnded={skipToMain}
          onError={skipToMain}
          preload="auto"
        />
      )}
      {livro && (
        <audio
          ref={audioMainRef}
          src={livro.audioResumoUrl || ""}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (audioMainRef.current && !isNaN(audioMainRef.current.duration)) {
              setMainDuration(audioMainRef.current.duration);
            }
          }}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}
    </Ctx.Provider>
  );
};
