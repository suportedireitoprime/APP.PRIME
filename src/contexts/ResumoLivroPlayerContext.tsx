import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import { fonteDeAudio } from '@/lib/nativo/audioOffline';
import { toast } from 'sonner';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@/lib/NativeAudio';

const isNative = Capacitor.isNativePlatform();

interface ResumoLivroPlayerContextType {
  livroAtual: LivroNormalizado | null;
  tocando: boolean;
  tempo: number;
  dur: number;
  velocidade: number;
  aberto: boolean; // Indicates if the main sheet/screen is open
  setAberto: (v: boolean) => void;
  tocar: (livro: LivroNormalizado) => Promise<void>;
  togglePlay: () => void;
  seek: (v: number) => void;
  setVelocidade: (rate: number) => void;
  fechar: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const audioIdOf = (l: LivroNormalizado) => `resumo-livro-${l.id}`;

const Ctx = createContext<ResumoLivroPlayerContextType | undefined>(undefined);

export function useResumoLivroPlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useResumoLivroPlayer deve ser usado dentro de ResumoLivroPlayerProvider');
  return ctx;
}

export const ResumoLivroPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [livroAtual, setLivroAtual] = useState<LivroNormalizado | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [dur, setDur] = useState(0);
  const [velocidade, setVelocidadeState] = useState(1);
  const [aberto, setAberto] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    void telaAcesa('resumo-livro', tocando);
    return () => {
      void telaAcesa('resumo-livro', false);
    };
  }, [tocando]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !livroAtual) return;
    registrarMidia({
      titulo: `Resumo: ${livroAtual.titulo}`,
      subtitulo: livroAtual.autor || livroAtual.area || 'Direito Prime',
      album: 'Resumos em Áudio',
      capaUrl: livroAtual.capa || undefined,
      audio: el,
      onStop: () => {
        el.pause();
        setTocando(false);
      },
      onSeek: (t) => {
        if (el) el.currentTime = t;
        setTempo(t);
      },
    });
  }, [livroAtual]);

  const tocar = useCallback(
    async (livro: LivroNormalizado) => {
      const el = audioRef.current;
      if (!el || !livro.audioResumoUrl) return;

      if (livroAtual?.id === livro.id) {
        if (isNative) {
          if (!tocando) {
            NativeAudio.play();
            setTocando(true);
          } else {
            NativeAudio.pause();
            setTocando(false);
          }
          return;
        }

        if (el.paused) {
          await el.play().catch(() => {});
          setTocando(true);
        } else {
          el.pause();
          setTocando(false);
        }
        return;
      }

      setLivroAtual(livro);
      setTempo(0);
      setDur(0);

      try {
        const src = await fonteDeAudio(audioIdOf(livro), livro.audioResumoUrl);
        if (isNative) {
          await NativeAudio.prepare({
            mainUrl: src,
            title: `Resumo: ${livro.titulo}`,
            author: livro.autor || livro.area || 'Direito Prime',
            coverUrl: livro.capa || ''
          });
          NativeAudio.play();
          setTocando(true);
        } else {
          el.src = src;
          el.playbackRate = velocidade;
          await el.play();
          setTocando(true);
        }
      } catch (err) {
        console.error('[ResumoLivroPlayer] Erro ao carregar/reproduzir áudio:', err);
        setTocando(false);
        toast.error('Não foi possível reproduzir este áudio. Verifique sua conexão.');
      }
    },
    [livroAtual, velocidade],
  );

  const togglePlay = useCallback(() => {
    if (isNative) {
      if (tocando) {
        NativeAudio.pause();
        setTocando(false);
      } else {
        NativeAudio.play();
        setTocando(true);
      }
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setTocando(true);
    } else {
      el.pause();
      setTocando(false);
    }
  }, [tocando]);

  const seek = useCallback((v: number) => {
    if (isNative) {
      NativeAudio.seek({ time: v });
      setTempo(v);
      return;
    }
    const el = audioRef.current;
    if (el) {
      el.currentTime = v;
      setTempo(v);
    }
  }, []);

  const setVelocidade = useCallback((rate: number) => {
    const el = audioRef.current;
    if (el) el.playbackRate = rate;
    setVelocidadeState(rate);
  }, []);

  const fechar = useCallback(() => {
    if (isNative) {
      NativeAudio.stop();
    } else {
      const el = audioRef.current;
      if (el) {
        el.pause();
        el.src = '';
      }
      clearMediaSession();
    }
    setTocando(false);
    setLivroAtual(null);
    setAberto(false);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const updateTime = () => setTempo(el.currentTime);
    const updateDur = () => setDur(el.duration || 0);
    const handleEnd = () => setTocando(false);
    const handlePlay = () => setTocando(true);
    const handlePause = () => setTocando(false);

    el.addEventListener('timeupdate', updateTime);
    el.addEventListener('durationchange', updateDur);
    el.addEventListener('loadedmetadata', updateDur);
    el.addEventListener('ended', handleEnd);
    el.addEventListener('play', handlePlay);
    el.addEventListener('pause', handlePause);

    return () => {
      el.removeEventListener('timeupdate', updateTime);
      el.removeEventListener('durationchange', updateDur);
      el.removeEventListener('loadedmetadata', updateDur);
      el.removeEventListener('ended', handleEnd);
      el.removeEventListener('play', handlePlay);
      el.removeEventListener('pause', handlePause);
    };
  }, []);

  // Polling for NativeAudio
  useEffect(() => {
    if (!isNative || !livroAtual) return;
    const interval = setInterval(async () => {
      try {
        const p = await NativeAudio.getProgress();
        setTempo(p.currentTime);
        setDur(p.duration);
        if (tocando !== p.isPlaying) {
          setTocando(p.isPlaying);
        }
        if (p.duration > 0 && p.currentTime >= p.duration - 0.5) {
            setTocando(false);
        }
      } catch (e) {}
    }, 250);
    return () => clearInterval(interval);
  }, [isNative, livroAtual, tocando]);

  return (
    <Ctx.Provider
      value={{
        livroAtual,
        tocando,
        tempo,
        dur,
        velocidade,
        aberto,
        setAberto,
        tocar,
        togglePlay,
        seek,
        setVelocidade,
        fechar,
        audioRef,
      }}
    >
      {children}
      <audio ref={audioRef} className="hidden" />
    </Ctx.Provider>
  );
};
