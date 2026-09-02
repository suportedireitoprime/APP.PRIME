import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchTodasLeisCantadas, registrarPlay, type LeiCantada } from "@/lib/leisCantadasApi";
import { registrarMidia, clearMediaSession } from "@/lib/mediaSession";
import { telaAcesa } from "@/lib/nativo/telaAcordada";
import { fonteDeAudio } from "@/lib/nativo/audioOffline";
import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@/lib/NativeAudio';

const isNative = Capacitor.isNativePlatform();

interface LeisCantadasPlayerContextType {
  faixas: LeiCantada[];
  loading: boolean;
  atualId: string | null;
  atual: LeiCantada | null;
  atualIdx: number;
  tocando: boolean;
  tempo: number;
  dur: number;
  aberto: boolean;
  setAberto: (v: boolean) => void;
  tocar: (f: LeiCantada) => void;
  togglePlay: () => void;
  pular: (dir: 1 | -1) => void;
  seek: (v: number) => void;
  fechar: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const Ctx = createContext<LeisCantadasPlayerContextType | undefined>(undefined);

export function useLeisCantadasPlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLeisCantadasPlayer deve estar dentro de LeisCantadasPlayerProvider");
  return ctx;
}

export const LeisCantadasPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [faixas, setFaixas] = useState<LeiCantada[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualId, setAtualId] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [dur, setDur] = useState(0);
  const [aberto, setAberto] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playsRegistrados = useRef<Set<string>>(new Set());

  // Cache aquecido: carrega as faixas assim que o app inicia (fora do caminho crítico).
  useEffect(() => {
    let cancelado = false;

    const warm = async () => {
      const dados = await fetchTodasLeisCantadas();
      if (cancelado) return;
      if (dados.length) setFaixas(dados);
      setLoading(false);
    };

    const idle = (cb: () => void) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: unknown) => void };
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(cb, { timeout: 1500 });
      else setTimeout(cb, 200);
    };

    idle(() => void warm());
    return () => { cancelado = true; };
  }, []);

  const atualIdx = useMemo(() => faixas.findIndex((f) => f.id === atualId), [faixas, atualId]);
  const atual = atualIdx >= 0 ? faixas[atualIdx] : null;

  const pularRef = useRef<(dir: 1 | -1) => void>(() => {});

  // Notificação de mídia do sistema (nativo/lockscreen) para a faixa atual.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !atual) return;
    registrarMidia({
      titulo: atual.titulo || `Art. ${atual.numero_artigo ?? ""}`,
      subtitulo: atual.lei_nome || "Leis Cantadas",
      album: "Leis Cantadas",
      capaUrl: (atual as Record<string, unknown>)?.capa_url as string | undefined,
      audio,
      onNext: atualIdx >= 0 && faixas[atualIdx + 1] ? () => pularRef.current(1) : undefined,
      onPrev: atualIdx > 0 ? () => pularRef.current(-1) : undefined,
      onStop: () => setTocando(false),
      onSeek: (t) => setTempo(t),
    });
  }, [atual?.id, atualIdx, faixas.length]);

  // Tela acesa enquanto o áudio está tocando (nativo + Wake Lock na web).
  useEffect(() => {
    void telaAcesa("leis-cantadas", tocando);
    return () => { void telaAcesa("leis-cantadas", false); };
  }, [tocando]);

  const tocar = (f: LeiCantada) => {
    if (atualId === f.id) {
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

      if (tocando) { audioRef.current?.pause(); setTocando(false); }
      else { audioRef.current?.play().catch(() => {}); setTocando(true); }
      return;
    }
    // Injeta faixa avulsa (ex.: resumos) na lista para o player conseguir renderizar
    setFaixas((prev) => (prev.some((p) => p.id === f.id) ? prev : [...prev, f]));
    setAtualId(f.id);
    setTocando(true);
    setTempo(0); setDur(0);
    if (!playsRegistrados.current.has(f.id)) {
      playsRegistrados.current.add(f.id);
      registrarPlay(f.id).catch(() => {});
    }
    // Prefere a cópia offline do aparelho, se existir.
    void (async () => {
      const src = await fonteDeAudio(f.id, f.audio_url);
      if (isNative) {
        await NativeAudio.prepare({
          mainUrl: src,
          title: f.titulo || `Art. ${f.numero_artigo ?? ""}`,
          author: f.lei_nome || "Leis Cantadas",
          coverUrl: (f as Record<string, unknown>)?.capa_url as string | undefined || ''
        });
        NativeAudio.play();
      } else {
        if (audioRef.current) { audioRef.current.src = src; audioRef.current.play().catch(() => {}); }
      }
    })();
  };

  const togglePlay = () => {
    if (!atual) return;
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
    tocar(atual);
  };

  const pular = (dir: 1 | -1) => {
    if (atualIdx < 0) return;
    const next = faixas[atualIdx + dir];
    if (next) tocar(next);
  };

  const seek = (v: number) => {
    if (isNative) {
      NativeAudio.seek({ time: v });
      setTempo(v);
      return;
    }
    if (audioRef.current) audioRef.current.currentTime = v;
    setTempo(v);
  };

  const fechar = () => {
    if (isNative) {
      NativeAudio.stop();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      clearMediaSession(audioRef.current);
    }
    setTocando(false);
    setAtualId(null);
    setTempo(0);
    setDur(0);
    setAberto(false);
  };

  pularRef.current = pular;

  // Polling for NativeAudio
  useEffect(() => {
    if (!isNative || !atualId) return;
    const interval = setInterval(async () => {
      try {
        const p = await NativeAudio.getProgress();
        setTempo(p.currentTime);
        setDur(p.duration);
        if (tocando !== p.isPlaying) {
          setTocando(p.isPlaying);
        }
        // Check for end of track manually or handle via progress
        if (p.duration > 0 && p.currentTime >= p.duration - 0.5) {
            setTocando(false);
            if (atualIdx >= 0 && faixas[atualIdx + 1]) {
                tocar(faixas[atualIdx + 1]);
            }
        }
      } catch (e) {}
    }, 250);
    return () => clearInterval(interval);
  }, [isNative, atualId, tocando, atualIdx, faixas, tocar]);

  const value: LeisCantadasPlayerContextType = {
    faixas, loading, atualId, atual, atualIdx, tocando, tempo, dur,
    aberto, setAberto, tocar, togglePlay, pular, seek, fechar, audioRef,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onEnded={() => pular(1)}
        onPause={() => setTocando(false)}
        onPlay={() => setTocando(true)}
        onTimeUpdate={(e) => setTempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        preload="auto"
      />
    </Ctx.Provider>
  );
};

export default LeisCantadasPlayerProvider;