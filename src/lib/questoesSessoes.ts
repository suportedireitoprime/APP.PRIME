import type { Questao } from '@/hooks/useQuestoes';

export type SessaoHistorico = {
  id: string; // timestamp string (e.g. Date.now().toString())
  dataInicio: string; // ISO
  dataUltimoAcesso: string; // ISO
  filtroAplicado: string; 
  questoes: Questao[];
  respostas: Record<string, { escolha: string; acertou: boolean }>;
  idx: number;
  streak: number;
  contexto: string;
};

const STORAGE_KEY = 'APP_PRIME_SESSOES_HISTORICO';

export function getSessoes(): SessaoHistorico[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveSessao(sessao: SessaoHistorico) {
  const all = getSessoes();
  const idx = all.findIndex(s => s.id === sessao.id);
  if (idx >= 0) {
    all[idx] = sessao;
  } else {
    all.unshift(sessao);
  }
  // manter apenas as últimas 30 sessões para não estourar localStorage
  if (all.length > 30) all.length = 30;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar sessão (storage cheio?)', e);
  }
}

export function getSessaoById(id: string): SessaoHistorico | undefined {
  return getSessoes().find(s => s.id === id);
}

export function removeSessao(id: string) {
  const all = getSessoes().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
