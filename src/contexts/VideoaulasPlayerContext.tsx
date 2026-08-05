import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';

export interface AulaVideo {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  descricao?: string | null;
  thumb?: string | null;
  thumbnail?: string | null;
  catalogoId?: string;
  areaSlug?: string;
}

interface VideoaulasPlayerContextType {
  atual: AulaVideo | null;
  tocando: boolean;
  tempo: number;
  duracao: number;
  miniPlayerAberto: boolean;
  tocarVideo: (aula: AulaVideo) => void;
  togglePlay: () => void;
  seek: (v: number) => void;
  fechar: () => void;
  setMiniPlayerAberto: (v: boolean) => void;
  setTocandoState: (v: boolean) => void;
  setTempoState: (v: number) => void;
  setDuracaoState: (v: number) => void;
}

const Ctx = createContext<VideoaulasPlayerContextType | undefined>(undefined);

export function useVideoaulasPlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useVideoaulasPlayer deve ser usado dentro de VideoaulasPlayerProvider');
  return ctx;
}

export const VideoaulasPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [atual, setAtual] = useState<AulaVideo | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [miniPlayerAberto, setMiniPlayerAberto] = useState(false);

  // Manter tela acesa no dispositivo enquanto o vídeo estiver reproduzindo
  useEffect(() => {
    void telaAcesa('videoaulas_global', tocando);
    return () => {
      void telaAcesa('videoaulas_global', false);
    };
  }, [tocando]);

  const tocarVideo = useCallback((aula: AulaVideo) => {
    setAtual(aula);
    setTocando(true);
    setTempo(0);
  }, []);

  const togglePlay = useCallback(() => {
    setTocando((prev) => !prev);
  }, []);

  const seek = useCallback((v: number) => {
    setTempo(v);
  }, []);

  const fechar = useCallback(() => {
    setAtual(null);
    setTocando(false);
    setTempo(0);
    setDuracao(0);
    setMiniPlayerAberto(false);
  }, []);

  const value: VideoaulasPlayerContextType = {
    atual,
    tocando,
    tempo,
    duracao,
    miniPlayerAberto,
    tocarVideo,
    togglePlay,
    seek,
    fechar,
    setMiniPlayerAberto,
    setTocandoState: setTocando,
    setTempoState: setTempo,
    setDuracaoState: setDuracao,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export default VideoaulasPlayerProvider;
