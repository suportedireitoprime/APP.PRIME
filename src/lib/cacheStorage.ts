/**
 * Utilitário seguro para leitura/escrita de caches efêmeros em localStorage.
 * Trata SSR e erros de quota (QuotaExceededError) sem interromper a UI.
 */
export function readCacheJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeCacheJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignora QuotaExceededError em dispositivos com pouco armazenamento
  }
}

export function removeCacheKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignora falhas de acesso ao storage
  }
}
