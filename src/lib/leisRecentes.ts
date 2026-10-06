import { createSyncedList, registerForSync } from './userSync';

export type LeiRecente = {
  tipo: string;
  leiId: string;
  nome: string;
  descricao: string;
  tabela_nome: string;
  openedAt: number;
};

const KEY = 'leis_recentes_v1';
const MAX = 20;

const recentesSync = registerForSync(createSyncedList<LeiRecente>({
  escopo: 'vademecum:recentes',
  storageKey: KEY,
  keyOf: (item) => item.leiId,
  atOf: (item) => item.openedAt,
  max: MAX,
  notify: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('recentes-updated'));
    }
  }
}));

export function getRecentes(): LeiRecente[] {
  return recentesSync.read();
}

export function pushRecente(lei: Omit<LeiRecente, 'openedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const item: LeiRecente = { ...lei, openedAt: Date.now() };
    recentesSync.put(item);
    if (lei.tabela_nome) {
      import('@/services/warmFavoritosService')
        .then((m) => {
          void m.persistLeiArtigosInBackground(lei.tabela_nome);
        })
        .catch(() => {});
    }
  } catch {}
}

export function clearRecentes() {
  recentesSync.clear();
}

// ---- Popularidade de busca (leis mais procuradas) ----
const POP_KEY = 'leis_populares_v1';

type PopMap = Record<string, number>;

function readPop(): PopMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(POP_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

export function bumpLeiSearch(leiId: string) {
  if (typeof window === 'undefined' || !leiId) return;
  try {
    const map = readPop();
    map[leiId] = (map[leiId] || 0) + 1;
    localStorage.setItem(POP_KEY, JSON.stringify(map));
  } catch {}
}

/** Retorna leiIds ordenados por popularidade (desc). */
export function getPopularLeiIds(): string[] {
  const map = readPop();
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

