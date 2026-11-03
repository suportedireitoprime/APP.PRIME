import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';
import { notifyMediaPlay, subscribeMediaPlay } from '@/lib/mediaCoordinator';
import { haptic } from '@/lib/nativeHaptics';
import { audiobooksTracking } from '@/lib/audiobooksTracking';
import type { AudiobookLivro, AudiobookCapitulo, AudiobookCue } from '@/data/audiobooksCatalogo';

interface AudiobookPlayerContextType {
  livroAtual: AudiobookLivro | null;
  capituloAtual: AudiobookCapitulo | null;
  capituloIndex: number;
  tocando: boolean;
  tempo: number;
  dur: number;
  velocidadeIndex: number;
  velocidades: number[];
  modalAberto: boolean;
  isPlayingTitulo: boolean;
  cueAtual: AudiobookCue | null;
  setModalAberto: (v: boolean) => void;
  tocarLivro: (livro: AudiobookLivro, capIdx?: number, tempoInicial?: number) => void;
  selecionarCapitulo: (idx: number) => void;
  togglePlay: () => void;
  pularSegundos: (delta: number) => void;
  seek: (v: number) => void;
  mudarVelocidade: () => void;
  proximoCapitulo: () => void;
  capituloAnterior: () => void;
  minimizar: () => void;
  fechar: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const VELOCIDADES = [1, 1.25, 1.5, 2];

const fallbackContext: AudiobookPlayerContextType = {
  livroAtual: null,
  capituloAtual: null,
  capituloIndex: 0,
  tocando: false,
  tempo: 0,
  dur: 0,
  velocidadeIndex: 0,
  velocidades: VELOCIDADES,
  modalAberto: false,
  isPlayingTitulo: false,
  cueAtual: null,
  setModalAberto: () => {},
  tocarLivro: () => {},
  selecionarCapitulo: () => {},
  togglePlay: () => {},
  pularSegundos: () => {},
  seek: () => {},
  mudarVelocidade: () => {},
  proximoCapitulo: () => {},
  capituloAnterior: () => {},
  minimizar: () => {},
  fechar: () => {},
  audioRef: { current: null },
};

const AudiobookPlayerContext = createContext<AudiobookPlayerContextType>(fallbackContext);

export function useAudiobookPlayer() {
  return useContext(AudiobookPlayerContext);
}

export const AudiobookPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [livroAtual, setLivroAtual] = useState<AudiobookLivro | null>(null);
  const [capituloIndex, setCapituloIndex] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [isPlayingTitulo, setIsPlayingTitulo] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [dur, setDur] = useState(0);
  const [velocidadeIndex, setVelocidadeIndex] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const capituloAtual = useMemo(() => {
    if (!livroAtual || !livroAtual.capitulos || livroAtual.capitulos.length === 0) return null;
    return livroAtual.capitulos[capituloIndex] || livroAtual.capitulos[0];
  }, [livroAtual, capituloIndex]);

  // Áudio ativo: toca primeiro o áudio de título do capítulo (~3s), depois a narração completa
  const activeAudioSrc = useMemo(() => {
    if (!capituloAtual) return '';
    return isPlayingTitulo && capituloAtual.audioTituloUrl
      ? capituloAtual.audioTituloUrl
      : capituloAtual.audioUrl;
  }, [capituloAtual, isPlayingTitulo]);

  // Salvar progresso com sincronização nativa no Supabase
  const lastSavedSecondRef = useRef(0);
  const salvarProgresso = useCallback((time: number) => {
    if (!livroAtual || !capituloAtual || isPlayingTitulo) return;
    
    // Evita chamadas repetidas no mesmo segundo
    const sec = Math.floor(time);
    if (sec === lastSavedSecondRef.current) return;
    lastSavedSecondRef.current = sec;

    const totalDur = dur || capituloAtual.duracaoSegundos || 600;
    audiobooksTracking.registrarProgresso(livroAtual.id, capituloIndex, sec, totalDur);
    audiobooksTracking.registrarRecente({
      id: livroAtual.id,
      titulo: livroAtual.titulo,
      autor: livroAtual.autor,
      capaUrl: livroAtual.capaUrl,
      capituloIndex,
      capituloTitulo: capituloAtual.titulo,
      tempoSegundos: sec,
      duracaoSegundos: totalDur,
      ts: Date.now(),
    });
  }, [livroAtual, capituloAtual, capituloIndex, isPlayingTitulo, dur]);

  // Sincronização e cálculo contínuo de legendas sem buracos
  const cueAtual = useMemo(() => {
    if (!capituloAtual) return null;
    if (isPlayingTitulo) {
      return { id: 0, start: 0, end: 5, text: capituloAtual.titulo };
    }
    const cues = capituloAtual.cues;
    if (!cues || cues.length === 0) return null;

    if (tempo < cues[0].start) {
      return cues[0];
    }

    for (let i = 0; i < cues.length; i++) {
      const c = cues[i];
      const nextCue = cues[i + 1];
      const maxEnd = nextCue ? nextCue.start : (c.end + 12);
      if (tempo >= c.start && tempo < maxEnd) {
        return c;
      }
    }
    return cues[cues.length - 1];
  }, [capituloAtual, isPlayingTitulo, tempo]);

  // Gerenciamento de WakeLock e MediaCoordinator
  useEffect(() => {
    void telaAcesa('audiobook', tocando);
    return () => {
      void telaAcesa('audiobook', false);
    };
  }, [tocando]);

  useEffect(() => {
    return subscribeMediaPlay((active) => {
      if (active !== 'audiobook') {
        const el = audioRef.current;
        if (el && !el.paused) el.pause();
        setTocando(false);
      }
    });
  }, []);

  // MediaSession API
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !livroAtual || !capituloAtual) return;

    registrarMidia({
      titulo: isPlayingTitulo ? `${capituloAtual.titulo} (Título)` : capituloAtual.titulo,
      subtitulo: `${livroAtual.autor} • ${capituloAtual.numero > 0 ? `Cap. ${capituloAtual.numero}` : 'Apresentação'}`,
      album: livroAtual.titulo,
      capaUrl: livroAtual.capaUrl,
      audio: el,
      onNext: capituloIndex < livroAtual.capitulos.length - 1 ? () => selecionarCapitulo(capituloIndex + 1) : undefined,
      onPrev: capituloIndex > 0 ? () => selecionarCapitulo(capituloIndex - 1) : undefined,
      onSeek: (t) => {
        if (el) {
          el.currentTime = t;
          setTempo(t);
        }
      },
      onStop: () => {
        el.pause();
        setTocando(false);
      },
    });

    return () => {
      clearMediaSession(el);
    };
  }, [livroAtual, capituloAtual, capituloIndex, isPlayingTitulo]);

  // Controles
  const tocarLivro = useCallback((livro: AudiobookLivro, capIdx = 0, tempoInicial = 0) => {
    haptic.selection();
    notifyMediaPlay('audiobook');
    setLivroAtual(livro);
    setCapituloIndex(capIdx);
    setModalAberto(true);

    const cap = livro.capitulos[capIdx] || livro.capitulos[0];
    const temTitulo = Boolean(cap?.audioTituloUrl) && tempoInicial <= 2;
    setIsPlayingTitulo(temTitulo);

    // Atualiza imediatamente o "Continuar Ouvindo" e sincroniza com o Supabase
    const duracaoCap = cap?.duracaoSegundos || 600;
    audiobooksTracking.registrarRecente({
      id: livro.id,
      titulo: livro.titulo,
      autor: livro.autor,
      capaUrl: livro.capaUrl,
      capituloIndex: capIdx,
      capituloTitulo: cap?.titulo || 'Capítulo 1',
      tempoSegundos: tempoInicial,
      duracaoSegundos: duracaoCap,
      ts: Date.now(),
    });
    audiobooksTracking.registrarProgresso(livro.id, capIdx, tempoInicial, duracaoCap);

    setTimeout(() => {
      const el = audioRef.current;
      if (!el) return;
      if (tempoInicial > 2 && !temTitulo) {
        el.currentTime = tempoInicial;
        setTempo(tempoInicial);
      }
      el.play()
        .then(() => setTocando(true))
        .catch(() => {});
    }, 100);
  }, []);

  const selecionarCapitulo = useCallback((idx: number) => {
    if (!livroAtual || !livroAtual.capitulos[idx]) return;
    haptic.selection();
    setCapituloIndex(idx);
    const cap = livroAtual.capitulos[idx];
    const temTitulo = Boolean(cap?.audioTituloUrl);
    setIsPlayingTitulo(temTitulo);
    setTempo(0);

    const duracaoCap = cap.duracaoSegundos || 600;
    audiobooksTracking.registrarRecente({
      id: livroAtual.id,
      titulo: livroAtual.titulo,
      autor: livroAtual.autor,
      capaUrl: livroAtual.capaUrl,
      capituloIndex: idx,
      capituloTitulo: cap.titulo,
      tempoSegundos: 0,
      duracaoSegundos: duracaoCap,
      ts: Date.now(),
    });
    audiobooksTracking.registrarProgresso(livroAtual.id, idx, 0, duracaoCap);

    setTimeout(() => {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        el.play()
          .then(() => setTocando(true))
          .catch(() => {});
      }
    }, 120);
  }, [livroAtual]);

  const togglePlay = useCallback(() => {
    haptic.impact();
    const el = audioRef.current;
    if (!el) return;

    if (tocando) {
      el.pause();
      setTocando(false);
    } else {
      notifyMediaPlay('audiobook');
      el.play()
        .then(() => setTocando(true))
        .catch(() => {});
    }
  }, [tocando]);

  const pularSegundos = useCallback((delta: number) => {
    haptic.selection();
    const el = audioRef.current;
    if (!el) return;
    if (isPlayingTitulo) {
      setIsPlayingTitulo(false);
    }
    const maxDur = dur || el.duration || 9999;
    const novo = Math.max(0, Math.min(maxDur, el.currentTime + delta));
    el.currentTime = novo;
    setTempo(novo);
    salvarProgresso(novo);
  }, [dur, isPlayingTitulo, salvarProgresso]);

  const seek = useCallback((novoTempo: number) => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlayingTitulo) {
      setIsPlayingTitulo(false);
    }
    el.currentTime = novoTempo;
    setTempo(novoTempo);
    salvarProgresso(novoTempo);
  }, [isPlayingTitulo, salvarProgresso]);

  const mudarVelocidade = useCallback(() => {
    haptic.selection();
    const proximoIdx = (velocidadeIndex + 1) % VELOCIDADES.length;
    setVelocidadeIndex(proximoIdx);
    const taxa = VELOCIDADES[proximoIdx];
    if (audioRef.current) {
      audioRef.current.playbackRate = taxa;
    }
  }, [velocidadeIndex]);

  const proximoCapitulo = useCallback(() => {
    if (livroAtual && capituloIndex < livroAtual.capitulos.length - 1) {
      selecionarCapitulo(capituloIndex + 1);
    }
  }, [livroAtual, capituloIndex, selecionarCapitulo]);

  const capituloAnterior = useCallback(() => {
    if (capituloIndex > 0) {
      selecionarCapitulo(capituloIndex - 1);
    }
  }, [capituloIndex, selecionarCapitulo]);

  const minimizar = useCallback(() => {
    haptic.selection();
    setModalAberto(false);
  }, []);

  const fechar = useCallback(() => {
    haptic.selection();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setTocando(false);
    setModalAberto(false);
    setLivroAtual(null);
  }, []);

  return (
    <AudiobookPlayerContext.Provider
      value={{
        livroAtual,
        capituloAtual,
        capituloIndex,
        tocando,
        tempo,
        dur,
        velocidadeIndex,
        velocidades: VELOCIDADES,
        modalAberto,
        isPlayingTitulo,
        cueAtual,
        setModalAberto,
        tocarLivro,
        selecionarCapitulo,
        togglePlay,
        pularSegundos,
        seek,
        mudarVelocidade,
        proximoCapitulo,
        capituloAnterior,
        minimizar,
        fechar,
        audioRef,
      }}
    >
      {/* Elemento de áudio centralizado e persistente que nunca reseta ao navegar ou minimizar */}
      <audio
        ref={audioRef}
        src={activeAudioSrc}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            const t = audioRef.current.currentTime;
            setTempo(t);
            if (!isPlayingTitulo) {
              if (Math.floor(t) % 4 === 0) {
                salvarProgresso(t);
              }
              // Registra métrica de audição no Supabase (tempo ativo)
              audiobooksTracking.registrarTempoOuvidoSupabase(0.5);
            }
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const d = audioRef.current.duration || capituloAtual?.duracaoSegundos || 0;
            setDur(d);
            audioRef.current.playbackRate = VELOCIDADES[velocidadeIndex];
          }
        }}
        onEnded={() => {
          if (isPlayingTitulo) {
            setIsPlayingTitulo(false);
            setTempo(0);
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => setTocando(true)).catch(() => {});
              }
            }, 80);
          } else if (livroAtual && capituloIndex < livroAtual.capitulos.length - 1) {
            proximoCapitulo();
          } else {
            setTocando(false);
          }
        }}
      />
      {children}
    </AudiobookPlayerContext.Provider>
  );
};
