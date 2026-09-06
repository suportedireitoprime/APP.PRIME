import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { get as idbGet, set as idbSet } from "idb-keyval";

export interface DicionarioTermo {
  letra: string;
  palavra: string;
  significado: string;
  exemplo_pratico: string | null;
}

const CACHE_KEY = "dicionario_juridico_v2";
const CACHE_AT_KEY = "dicionario_juridico_at_v2";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias de validade

let memDicionario: DicionarioTermo[] | null = null;
let idbWarmPromise: Promise<DicionarioTermo[] | null> | null = null;

// Pré-aquece a memória RAM em segundo plano a partir do IndexedDB
if (typeof window !== "undefined") {
  idbWarmPromise = idbGet<DicionarioTermo[]>(CACHE_KEY)
    .then((cached) => {
      if (cached && Array.isArray(cached) && cached.length > 0) {
        memDicionario = cached;
        return cached;
      }
      return null;
    })
    .catch(() => null);
}

function readSyncCache(): DicionarioTermo[] | null {
  if (memDicionario && memDicionario.length > 0) return memDicionario;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      memDicionario = parsed;
      return parsed;
    }
  } catch {
    /* noop */
  }
  return null;
}

async function readPersistedCache(): Promise<DicionarioTermo[] | null> {
  const sync = readSyncCache();
  if (sync) return sync;
  if (idbWarmPromise) {
    const fromPromise = await idbWarmPromise;
    if (fromPromise) return fromPromise;
  }
  try {
    const fromIdb = await idbGet<DicionarioTermo[]>(CACHE_KEY);
    if (fromIdb && Array.isArray(fromIdb) && fromIdb.length > 0) {
      memDicionario = fromIdb;
      return fromIdb;
    }
  } catch {
    /* noop */
  }
  return null;
}

async function writeCache(rows: DicionarioTermo[]): Promise<void> {
  if (!rows || rows.length === 0) return;
  memDicionario = rows;
  if (typeof window === "undefined") return;
  try {
    await idbSet(CACHE_KEY, rows);
    localStorage.setItem(CACHE_AT_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
  try {
    // Guarda cópia compacta em localStorage se couber sem estourar quota
    if (rows.length <= 500) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
    }
  } catch {
    /* quota cheia */
  }
}

export function useDicionarioJuridico() {
  return useQuery({
    queryKey: ["dicionario_juridico"],
    initialData: () => readSyncCache() ?? undefined,
    staleTime: TTL_MS,
    queryFn: async (): Promise<DicionarioTermo[]> => {
      // Se estiver offline, serve direto do cache persistido sem abrir conexão de rede
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = await readPersistedCache();
        if (cached && cached.length > 0) return cached;
      }

      const pageSize = 1000;
      const all: DicionarioTermo[] = [];
      try {
        for (let from = 0; ; from += pageSize) {
          const { data, error } = await supabase
            .from("dicionario_juridico")
            .select("letra,palavra,significado,exemplo_pratico")
            .order("palavra", { ascending: true })
            .range(from, from + pageSize - 1);
          if (error) {
            const cached = await readPersistedCache();
            if (cached && cached.length > 0) return cached;
            throw error;
          }
          const rows = (data ?? []) as DicionarioTermo[];
          all.push(...rows);
          if (rows.length < pageSize) break;
        }
        void writeCache(all);
        return all;
      } catch (err) {
        const cached = await readPersistedCache();
        if (cached && cached.length > 0) return cached;
        throw err;
      }
    },
  });
}