import { Brain, Layers, GitBranch, Network, BookOpen, Scale, Gavel, Heart, Clock, Award, Folder, FileText, ShieldCheck } from 'lucide-react';
import type { VisualCategoria, VisualTipo } from '@/lib/visuaisJuridicos/types';
import type { ArtigoLei } from '@/data/mockData';
import { itensDaCategoria } from '@/lib/visuaisJuridicos/catalogo';

export const TIPO_ICON: Record<VisualTipo, typeof Brain> = {
  mapa_mental: Brain,
  infografico: Layers,
  fluxograma: GitBranch,
  diagrama: Network,
};

export const TIPO_COR: Record<VisualTipo, string> = {
  mapa_mental: '#a855f7',
  infografico: '#f59e0b',
  fluxograma: '#22c55e',
  diagrama: '#8b5cf6',
};

export const CATEGORIA_ICON: Record<VisualCategoria, typeof Brain> = {
  materias: BookOpen,
  codigos: Scale,
  estatutos: Award,
  leis_especiais: FileText,
  previdenciario: ShieldCheck,
  leis: Scale,
  jurisprudencia: Gavel,
  sumulas: Gavel,
};

export const CATEGORIA_COR: Record<VisualCategoria, string> = {
  materias: '#38bdf8',
  codigos: '#ef4444',
  estatutos: '#10b981',
  leis_especiais: '#f59e0b',
  previdenciario: '#a855f7',
  leis: '#e01f47',
  jurisprudencia: '#a78bfa',
  sumulas: '#c084fc',
};

export const ITEM_CORES = ['#a855f7', '#38bdf8', '#f59e0b', '#22c55e', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'];

export function getCorParaItem(key: string, categoria: VisualCategoria | string = 'materias'): string {
  try {
    const list = itensDaCategoria(categoria as VisualCategoria);
    const idx = list.findIndex(i => i.key === key);
    if (idx !== -1) return ITEM_CORES[idx % ITEM_CORES.length];
  } catch (e) {}

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ITEM_CORES[Math.abs(hash) % ITEM_CORES.length];
}

export const TIPOS: VisualTipo[] = ['mapa_mental', 'infografico', 'fluxograma', 'diagrama'];
export const CATEGORIAS: VisualCategoria[] = ['codigos', 'estatutos', 'leis_especiais', 'sumulas'];

export const norm = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export type Filtro = 'todos' | 'favoritos' | 'recentes' | 'sobre' | 'sugeridos';

import { Sparkles, Info } from 'lucide-react';

export const FILTROS: { id: Filtro; label: string; Icone: typeof Layers; color: string }[] = [
  { id: 'favoritos', label: 'Favoritos', Icone: Heart, color: '#34D399' },
  { id: 'recentes', label: 'Recentes', Icone: Clock, color: '#F87171' },
  { id: 'sugeridos', label: 'Sugeridos', Icone: Sparkles, color: '#FBBF24' },
  { id: 'sobre', label: 'Sobre', Icone: Info, color: '#A78BFA' },
];

/** Cabeçalhos estruturais (PARTE GERAL, TÍTULO, CAPÍTULO…) não são artigos. */
export const RE_ESTRUTURA = /^(parte|livro|t[ií]tulo|cap[ií]tulo|se[çc][ãa]o|subse[çc][ãa]o|disposi)/i;

export function isArtigoReal(a: ArtigoLei) {
  const num = String(a.numero ?? '').trim();
  if (!num) return false;
  if (RE_ESTRUTURA.test(num)) return false;
  return /\d/.test(num);
}

/** Simplifica nomes nos cards para torná-los concisos e elegantes (remove prefixos redundantes) */
export function limparNomeCard(label: string): string {
  if (!label) return '';
  return label
    .replace(/^Estatuto\s+(da\s+Pessoa\s+com\s+Câncer|da\s+Pessoa\s+com\s+Deficiência|da\s+Criança\s+e\s+do\s+Adolescente|da\s+Igualdade\s+Racial|Nacional\s+da\s+Microempresa|do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, (_m, p1) => {
      if (p1?.toLowerCase().includes('criança')) return 'Criança e Adolescente';
      if (p1?.toLowerCase().includes('deficiência')) return 'Pessoa com Deficiência';
      if (p1?.toLowerCase().includes('câncer')) return 'Pessoa com Câncer';
      if (p1?.toLowerCase().includes('igualdade')) return 'Igualdade Racial';
      if (p1?.toLowerCase().includes('microempresa')) return 'Microempresa';
      return '';
    })
    .replace(/^Direito\s+Processual\s+Civil/i, 'Processo Civil')
    .replace(/^Direito\s+Processual\s+Penal/i, 'Processo Penal')
    .replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '')
    .trim();
}
