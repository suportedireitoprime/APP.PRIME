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

const CHAVE_PROGRESSO = 'audioaula_ultimo_progresso_v1';
let memoriaCache: ProgressoAudioaula | null = null;

export function salvarProgressoAudioaula(progresso: ProgressoAudioaula): void {
  memoriaCache = progresso;
  try {
    localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
    window.dispatchEvent(new CustomEvent('audioaula:progresso-mudou', { detail: progresso }));
  } catch {
    /* ignore storage quota errors */
  }
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
    window.dispatchEvent(new CustomEvent('audioaula:progresso-mudou', { detail: null }));
  } catch {
    /* ignore */
  }
}

/** Converte qualquer link de áudio do Drive em link direto de streaming com CORS * */
export function normalizarStreamAudio(url: string | null | undefined): string {
  if (!url) return '';
  const u = url.trim();
  // Se for Google Drive (em qualquer formato: uc?id=, /file/d/..., open?id=)
  const m = u.match(/(?:id=|\/d\/|\/file\/d\/)([\w-]{20,})/);
  if (m) {
    const fileId = m[1];
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
  }
  return u;
}
