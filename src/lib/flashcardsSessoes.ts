export type FlashcardsSessaoHistorico = {
  id: string; // timestamp string (e.g. Date.now().toString())
  dataInicio: string; // ISO
  dataUltimoAcesso: string; // ISO
  queryString: string; // Ex: "areas=penal&limite=50"
  filtroAplicado: string; // Ex: "Penal, Civil - 50 Cards"
  cardsRevisados: number;
  totalCards: number;
};

const STORAGE_KEY = 'APP_PRIME_FLASHCARDS_SESSOES';

export function getFlashcardsSessoes(): FlashcardsSessaoHistorico[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveFlashcardsSessao(sessao: FlashcardsSessaoHistorico) {
  const all = getFlashcardsSessoes();
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
    console.error('Erro ao salvar sessão de flashcards (storage cheio?)', e);
  }
}

export function removeFlashcardsSessao(id: string) {
  const all = getFlashcardsSessoes().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
