import { useState, useEffect } from "react";
import { safeStorageUrl } from "@/lib/cdnImg";
import { supabase } from "@/integrations/supabase/client";

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
const timersSync = new Map<number, ReturnType<typeof setTimeout>>();

/** Sincroniza o progresso no Supabase com debouncing para evitar excesso de requisições durante a reprodução */
function sincronizarSupabase(
  id: number,
  tempo: number,
  duracao: number,
  pct: number,
  concluida: boolean,
  imediato = false,
) {
  const existingTimer = timersSync.get(id);
  if (existingTimer) {
    clearTimeout(existingTimer);
    timersSync.delete(id);
  }

  const executarUpsert = async () => {
    timersSync.delete(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      await supabase.from("videoaulas_progresso").upsert(
        {
          user_id: user.id,
          tabela: "audioaulas_acervo",
          registro_id: String(id),
          video_id: String(id),
          tempo_atual: Math.round(tempo),
          duracao: Math.round(duracao),
          percentual: pct,
          concluida,
        },
        { onConflict: "user_id,tabela,registro_id" },
      );
    } catch {
      /* Silenciosamente ignora falhas de conexão/offline */
    }
  };

  if (imediato || concluida) {
    void executarUpsert();
  } else {
    const timer = setTimeout(executarUpsert, 3500);
    timersSync.set(id, timer);
  }
}

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
    const pctFinal = jaConcluida ? 100 : pctCalculada;

    mapa[progresso.id] = {
      id: progresso.id,
      tempo,
      duracao: dur > 0 ? dur : mapa[progresso.id]?.duracao || 0,
      pct: pctFinal,
      concluida: jaConcluida,
      timestamp: Date.now(),
    };
    memoriaMapaCache = mapa;
    localStorage.setItem(CHAVE_MAPA_PROGRESSO, JSON.stringify(mapa));
    window.dispatchEvent(new CustomEvent("audioaula:mapa-progresso-mudou", { detail: mapa }));

    // Sincroniza com o Supabase em segundo plano
    sincronizarSupabase(progresso.id, tempo, dur, pctFinal, jaConcluida, jaConcluida);
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

    // Sincroniza imediatamente com o Supabase
    sincronizarSupabase(id, dur, dur, 100, true, true);
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
    const novoTempo = novoStatus ? dur : 0;
    const novoPct = novoStatus ? 100 : 0;

    mapa[id] = {
      id,
      tempo: novoTempo,
      duracao: dur,
      pct: novoPct,
      concluida: novoStatus,
      timestamp: Date.now(),
    };
    memoriaMapaCache = mapa;
    localStorage.setItem(CHAVE_MAPA_PROGRESSO, JSON.stringify(mapa));
    window.dispatchEvent(new CustomEvent("audioaula:mapa-progresso-mudou", { detail: mapa }));

    // Sincroniza imediatamente com o Supabase
    sincronizarSupabase(id, novoTempo, dur, novoPct, novoStatus, true);
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

/** Carrega os progressos remotos salvos no Supabase e mescla com o cache local */
export async function carregarProgressoSupabase(): Promise<Record<number, ProgressoAulaItem>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return obterMapaProgressoAudioaulas();

    const { data, error } = await supabase
      .from("videoaulas_progresso")
      .select("registro_id, tempo_atual, duracao, percentual, concluida, updated_at")
      .eq("tabela", "audioaulas_acervo");

    if (error || !data || data.length === 0) {
      return obterMapaProgressoAudioaulas();
    }

    const mapaAtual = { ...obterMapaProgressoAudioaulas() };
    let mudou = false;

    for (const row of data) {
      const idNum = Number(row.registro_id);
      if (idNum) {
        const itemLocal = mapaAtual[idNum];
        const tsRemoto = row.updated_at ? new Date(row.updated_at).getTime() : Date.now();
        if (!itemLocal || tsRemoto >= (itemLocal.timestamp || 0) || row.concluida) {
          mapaAtual[idNum] = {
            id: idNum,
            tempo: row.tempo_atual ?? 0,
            duracao: row.duracao ?? 0,
            pct: row.percentual ?? 0,
            concluida: row.concluida ?? false,
            timestamp: tsRemoto,
          };
          mudou = true;
        }
      }
    }

    if (mudou) {
      memoriaMapaCache = mapaAtual;
      localStorage.setItem(CHAVE_MAPA_PROGRESSO, JSON.stringify(mapaAtual));
      window.dispatchEvent(new CustomEvent("audioaula:mapa-progresso-mudou", { detail: mapaAtual }));
    }

    return mapaAtual;
  } catch {
    return obterMapaProgressoAudioaulas();
  }
}

/** Hook reativo para acompanhar métricas e progresso de escuta das audioaulas */
export function useAudioaulasProgresso() {
  const [mapa, setMapa] = useState<Record<number, ProgressoAulaItem>>(() =>
    obterMapaProgressoAudioaulas(),
  );

  useEffect(() => {
    // Sincroniza do Supabase ao montar o hook
    void carregarProgressoSupabase();

    const handleMudanca = () => {
      setMapa({ ...obterMapaProgressoAudioaulas() });
    };

    window.addEventListener("audioaula:mapa-progresso-mudou", handleMudanca);

    // Escuta mudanças de autenticação (ex: login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        void carregarProgressoSupabase();
      }
    });

    return () => {
      window.removeEventListener("audioaula:mapa-progresso-mudou", handleMudanca);
      subscription.unsubscribe();
    };
  }, []);

  return {
    mapa,
    obterProgresso: (aulaId: number) => mapa[aulaId] || null,
    marcarConcluida: marcarAulaConcluida,
    alternarConcluida: alternarAulaConcluida,
    recarregarDoServidor: carregarProgressoSupabase,
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
