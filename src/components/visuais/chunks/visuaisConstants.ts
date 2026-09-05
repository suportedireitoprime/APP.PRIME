import { Brain, Layers, GitBranch, Network, BookOpen, Scale, Gavel, Star, Clock } from 'lucide-react';
import type { VisualCategoria, VisualTipo } from '@/lib/visuaisJuridicos/types';
import type { ArtigoLei } from '@/data/mockData';

export const TIPO_ICON: Record<VisualTipo, typeof Brain> = {
  mapa_mental: Brain,
  infografico: Layers,
  fluxograma: GitBranch,
  diagrama: Network,
};

export const TIPO_COR: Record<VisualTipo, string> = {
  mapa_mental: '#ef3a5d',
  infografico: '#f59e0b',
  fluxograma: '#22c55e',
  diagrama: '#8b5cf6',
};

export const CATEGORIA_ICON: Record<VisualCategoria, typeof Brain> = {
  materias: BookOpen,
  leis: Scale,
  jurisprudencia: Gavel,
};

export const CATEGORIA_COR: Record<VisualCategoria, string> = {
  materias: '#38bdf8',
  leis: '#e01f47',
  jurisprudencia: '#a78bfa',
};

export const ITEM_CORES = ['#e01f47', '#38bdf8', '#f59e0b', '#22c55e', '#a78bfa', '#ec4899', '#14b8a6', '#f97316'];

export const TIPOS: VisualTipo[] = ['mapa_mental', 'infografico', 'fluxograma', 'diagrama'];
export const CATEGORIAS: VisualCategoria[] = ['materias', 'leis', 'jurisprudencia'];

export const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export type Filtro = 'todos' | 'favoritos' | 'recentes';

export const FILTROS: { id: Filtro; label: string; Icone: typeof Layers }[] = [
  { id: 'todos', label: 'Todos', Icone: Layers },
  { id: 'favoritos', label: 'Favoritos', Icone: Star },
  { id: 'recentes', label: 'Recentes', Icone: Clock },
];

/** Cabeçalhos estruturais (PARTE GERAL, TÍTULO, CAPÍTULO…) não são artigos. */
export const RE_ESTRUTURA = /^(parte|livro|t[ií]tulo|cap[ií]tulo|se[çc][ãa]o|subse[çc][ãa]o|disposi)/i;

export function isArtigoReal(a: ArtigoLei) {
  const num = String(a.numero ?? '').trim();
  if (!num) return false;
  if (RE_ESTRUTURA.test(num)) return false;
  return /\d/.test(num);
}
