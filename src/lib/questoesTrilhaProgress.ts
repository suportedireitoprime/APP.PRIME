export interface TopicoProgresso {
  respondidas: number;
  acertos: number;
  ultimoTreino?: number;
}

const STORAGE_PREFIX = 'questoes:progresso:';

export function getProgressoTopico(slug: string, tema: string): TopicoProgresso {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (raw) {
      const data = JSON.parse(raw);
      return data[tema] || { respondidas: 0, acertos: 0 };
    }
  } catch {}
  return { respondidas: 0, acertos: 0 };
}

export function salvarProgressoTopico(slug: string, tema: string, acertou: boolean) {
  try {
    const key = `${STORAGE_PREFIX}${slug}`;
    const raw = localStorage.getItem(key);
    const data: Record<string, TopicoProgresso> = raw ? JSON.parse(raw) : {};
    const cur = data[tema] || { respondidas: 0, acertos: 0 };
    data[tema] = {
      respondidas: cur.respondidas + 1,
      acertos: cur.acertos + (acertou ? 1 : 0),
      ultimoTreino: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function getAllProgressoArea(slug: string): Record<string, TopicoProgresso> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}
