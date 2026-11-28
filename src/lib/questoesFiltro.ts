export type QuestoesFiltro = {
  segmentos: string[];
  disciplinas: string[];
  assuntos: string[];
  topicos: string[];
  anos: string[];
  status: string[];
  ordem: 'embaralhado' | 'original';
  quantidade: number | null;
};

export const FILTRO_KEY = 'questoes:filtro';

export const FILTRO_VAZIO: QuestoesFiltro = {
  segmentos: [],
  disciplinas: [],
  assuntos: [],
  topicos: [],
  anos: [],
  status: [],
  ordem: 'embaralhado',
  quantidade: null,
};

export function lerFiltroSalvo(): QuestoesFiltro | null {
  try {
    const raw = sessionStorage.getItem(FILTRO_KEY);
    return raw ? { ...FILTRO_VAZIO, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export const STATUS = [
  { id: 'nao_resolvidas', label: 'Não resolvi' },
  { id: 'resolvidas', label: 'Resolvi' },
  { id: 'acertei', label: 'Acertei' },
  { id: 'errei', label: 'Errei' },
];
