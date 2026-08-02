// Mini persistência de dados de useQuery em localStorage.
// Mantém pintura instantânea entre navegações (cache-first), com revalidação em background.
const PREFIX = "lvq:";

export function loadPersisted<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 24): T | undefined {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { t: number; v: T };
    if (!parsed || typeof parsed.t !== "number") return undefined;
    if (Date.now() - parsed.t > maxAgeMs) return undefined;
    return parsed.v;
  } catch {
    return undefined;
  }
}

export function savePersisted<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {
    /* quota / private mode — ignore */
  }
}

// Para `useQuery({ initialData, initialDataUpdatedAt })`
export function persistedInitial<T>(key: string, maxAgeMs?: number) {
  const v = loadPersisted<T>(key, maxAgeMs);
  if (v === undefined) return {};
  return {
    initialData: v,
    initialDataUpdatedAt: 0, // marca como stale → revalida em background
  } as const;
}
