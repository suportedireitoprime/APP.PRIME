import { useState, useEffect } from "react";
import { safeStorageUrl } from "@/lib/cdnImg";

export interface ProgressoAudioaula {
  id: number;
  area: string;
  tema: string | null;
  titulo: string;
  sequencia: number | null;
  url_audio: string | null;
  tempo: number;
  duracao: number;
  timestamp: number;
}

export interface ProgressoAulaItem {
  id: number;
  tempo: number;
  duracao: number;
  pct: number;
  concluida: boolean;
  timestamp: number;
}

const CHAVE_PROGRESSO = "audioaula_ultimo_progresso_v1";
const CHAVE_MAPA_PROGRESSO = "audioaula_progresso_map_v1";

let memoriaCache: ProgressoAudioaula | null = null;
let memoriaMapaCache: Record<number, ProgressoAulaItem> | null = null;

export function obterMapaProgressoAudioaulas(): Record<number, ProgressoAulaItem> {
  if (memoriaMapaCache) return memoriaMapaCache;
  try {
    const raw = localStorage.getItem(CHAVE_MAPA_PROGRESSO);
    if (!raw) {
      memoriaMapaCache = {};
      return memoriaMapaCache;
    }
    const parsed = JSON.parse(raw) as Record<number, ProgressoAulaItem>;
    memoriaMapaCache = parsed || {};
    return memoriaMapaCache;
  } catch {
    memoriaMapaCache = {};
    return memoriaMapaCache;
  }
}

export function salvarProgressoAudioaula(progresso: ProgressoAudioaula): void {
  memoriaCache = progresso;
  try {
    localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
    window.dispatchEvent(new CustomEvent("audioaula:progresso-mudou", { detail: progresso }));

    // Atualiza também o mapa persistente por aula
    const mapa = { ...obterMapaProgressoAudioaulas() };
    const dur = Math.round(progresso.duracao || 0);
    const tempo = Math.round(progresso.tempo || 0);
    const pctCalculada = dur > 0 ? Math.min(100, Math.round((tempo / dur) * 100)) : 0;
    const jaConcluida = mapa[progresso.id]?.concluida || pctCalculada >= 85;

    mapa[progresso.id] = {
      id: progresso.id,
      tempo,
      duracao: dur > 0 ? dur : mapa[progresso.id]?.duracao || 0,
      pct: jaConcluida ? 100 : pctCalculada,
      concluida: jaConcluida,
      timestamp: Date.now(),
    };
    memoriaMapaCache = mapa;
    localStorage.setItem(CHAVE_MAPA_PROGRESSO, JSON.stringify(mapa));
    window.dispatchEvent(new CustomEvent("audioaula:mapa-progresso-mudou", { detail: mapa }));
  } catch {
    /* ignore storage quota errors */
  }
}

export function marcarAulaConcluida(id: number, duracao = 0): void {
  try {
    const mapa = { ...obterMapaProgressoAudioaulas() };
    const anterior = mapa[id];
    const dur = Math.round(duracao || anterior?.duracao || 600);
    mapa[id] = {
      id,
      tempo: dur,
      duracao: dur,
      pct: 100,
      concluida: true,
      timestamp: Date.now(),
    };
    memoriaMapaCache = mapa;
    localStorage.setItem(CHAVE_MAPA_PROGRESSO, JSON.stringify(mapa));
    window.dispatchEvent(new CustomEvent("audioaula:mapa-progresso-mudou", { detail: mapa }));
  } catch {
    /* ignore */
  }
}

export function alternarAulaConcluida(id: number, duracao = 0): boolean {
  try {
    const mapa = { ...obterMapaProgressoAudioaulas() };
    const anterior = mapa[id];
    const novoStatus = !anterior?.concluida;
    const dur = Math.round(duracao || anterior?.duracao || 600);

    mapa[id] = {
      id,
      tempo: novoStatus ? dur : 0,
      duracao: dur,
      pct: novoStatus ? 100 : 0,
      concluida: novoStatus,
      timestamp: Date.now(),
    };
    memoriaMapaCache = mapa;
    localStorage.setItem(CHAVE_MAPA_PROGRESSO, JSON.stringify(mapa));
    window.dispatchEvent(new CustomEvent("audioaula:mapa-progresso-mudou", { detail: mapa }));
    return novoStatus;
  } catch {
    return false;
  }
}

export function obterProgressoAula(id: number): ProgressoAulaItem | null {
  const mapa = obterMapaProgressoAudioaulas();
  return mapa[id] || null;
}

export function obterUltimoProgressoAudioaula(): ProgressoAudioaula | null {
  if (memoriaCache) return memoriaCache;
  try {
    const raw = localStorage.getItem(CHAVE_PROGRESSO);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProgressoAudioaula;
    memoriaCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function limparProgressoAudioaula(): void {
  memoriaCache = null;
  try {
    localStorage.removeItem(CHAVE_PROGRESSO);
    window.dispatchEvent(new CustomEvent("audioaula:progresso-mudou", { detail: null }));
  } catch {
    /* ignore */
  }
}

/** Hook reativo para acompanhar métricas e progresso de escuta das audioaulas */
export function useAudioaulasProgresso() {
  const [mapa, setMapa] = useState<Record<number, ProgressoAulaItem>>(() =>
    obterMapaProgressoAudioaulas(),
  );

  useEffect(() => {
    const handleMudanca = () => {
      setMapa({ ...obterMapaProgressoAudioaulas() });
    };

    window.addEventListener("audioaula:mapa-progresso-mudou", handleMudanca);
    return () => {
      window.removeEventListener("audioaula:mapa-progresso-mudou", handleMudanca);
    };
  }, []);

  return {
    mapa,
    obterProgresso: (aulaId: number) => mapa[aulaId] || null,
    marcarConcluida: marcarAulaConcluida,
    alternarConcluida: alternarAulaConcluida,
  };
}

/** Converte qualquer link de áudio do Drive em link direto de streaming com CORS e roteia Supabase para R2 * */
export function normalizarStreamAudio(url: string | null | undefined): string {
  if (!url) return "";
  const u = url.trim();
  const m = u.match(/(?:id=|\/d\/|\/file\/d\/)([\w-]{20,})/);
  if (m) {
    const fileId = m[1];
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
  }
  return safeStorageUrl(u) || u;
}
