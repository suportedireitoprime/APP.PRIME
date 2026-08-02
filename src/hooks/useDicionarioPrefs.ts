import { useCallback, useEffect, useState } from 'react';
import { createSyncedList, registerForSync } from '@/lib/userSync';

type Termo = { p: string; at: number };

const FAV_KEY = 'dicionario:favoritos:v2';
const REC_KEY = 'dicionario:recentes:v2';
const LEGACY_FAV = 'dicionario:favoritos';
const LEGACY_REC = 'dicionario:recentes';
const MAX_RECENTES = 60;

const notify = () => window.dispatchEvent(new CustomEvent('dicionario-prefs'));

const favList = registerForSync(
  createSyncedList<Termo>({
    escopo: 'dicionario:favoritos',
    storageKey: FAV_KEY,
    keyOf: (t) => t.p,
    atOf: (t) => Number(t.at) || 0,
    notify,
  }),
);

const recList = registerForSync(
  createSyncedList<Termo>({
    escopo: 'dicionario:recentes',
    storageKey: REC_KEY,
    keyOf: (t) => t.p,
    atOf: (t) => Number(t.at) || 0,
    max: MAX_RECENTES,
    notify,
  }),
);

/** Migra o formato antigo (array de strings) para o novo, uma única vez. */
function migrarLegado() {
  if (typeof window === 'undefined') return;
  const pares: Array<[string, typeof favList]> = [
    [LEGACY_FAV, favList],
    [LEGACY_REC, recList],
  ];
  for (const [legacyKey, list] of pares) {
    try {
      const raw = localStorage.getItem(legacyKey);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && list.read().length === 0) {
        const now = Date.now();
        arr
          .filter((v: unknown) => typeof v === 'string')
          .reverse()
          .forEach((p: string, i: number) => list.put({ p, at: now + i }));
      }
      localStorage.removeItem(legacyKey);
    } catch {
      /* ignore */
    }
  }
}
migrarLegado();

/** Favoritos e recentes do Dicionário Jurídico (locais + sincronizados na conta). */
export function useDicionarioPrefs() {
  const [favoritos, setFavoritos] = useState<string[]>(() => favList.read().map((t) => t.p));
  const [recentes, setRecentes] = useState<string[]>(() => recList.read().map((t) => t.p));

  useEffect(() => {
    const sync = () => {
      setFavoritos(favList.read().map((t) => t.p));
      setRecentes(recList.read().map((t) => t.p));
    };
    window.addEventListener('dicionario-prefs', sync);
    window.addEventListener('storage', sync);
    void Promise.all([favList.pull(), recList.pull()]).then(sync);
    return () => {
      window.removeEventListener('dicionario-prefs', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isFavorito = useCallback((palavra: string) => favoritos.includes(palavra), [favoritos]);

  const toggleFavorito = useCallback((palavra: string) => {
    if (favList.has(palavra)) {
      favList.remove(palavra);
      return false;
    }
    favList.put({ p: palavra, at: Date.now() });
    return true;
  }, []);

  const registrarRecente = useCallback((palavra: string) => {
    recList.put({ p: palavra, at: Date.now() });
  }, []);

  const limparRecentes = useCallback(() => recList.clear(), []);

  return { favoritos, recentes, isFavorito, toggleFavorito, registrarRecente, limparRecentes };
}
