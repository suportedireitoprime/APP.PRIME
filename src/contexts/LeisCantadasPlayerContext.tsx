import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchTodasLeisCantadas, registrarPlay, type LeiCantada } from "@/lib/leisCantadasApi";

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

  const tocar = (f: LeiCantada) => {
    if (atualId === f.id) {
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
    setTimeout(() => {
      if (audioRef.current) { audioRef.current.src = f.audio_url; audioRef.current.play().catch(() => {}); }
    }, 0);
  };

  const togglePlay = () => {
    if (!atual) return;
    tocar(atual);
  };

  const pular = (dir: 1 | -1) => {
    if (atualIdx < 0) return;
    const next = faixas[atualIdx + dir];
    if (next) tocar(next);
  };

  const seek = (v: number) => {
    if (audioRef.current) audioRef.current.currentTime = v;
    setTempo(v);
  };

  const fechar = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
    setTocando(false);
    setAtualId(null);
    setTempo(0);
    setDur(0);
    setAberto(false);
  };

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