import { Brain, Layers, GitBranch, Network, BookOpen, Scale, Gavel, Bookmark, Clock, Award, Folder, FileText, ShieldCheck } from 'lucide-react';
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

export type Filtro = 'todos' | 'favoritos' | 'recentes' | 'sobre' | 'sugeridos' | 'pastas';

import { Sparkles, Info } from 'lucide-react';

export const FILTROS: { id: Filtro; label: string; Icone: typeof Layers; color: string }[] = [
  { id: 'favoritos', label: 'Favoritos', Icone: Bookmark, color: '#C084FC' },
  { id: 'recentes', label: 'Recentes', Icone: Clock, color: '#A855F7' },
  { id: 'sugeridos', label: 'Sugeridos', Icone: Sparkles, color: '#C084FC' },
  { id: 'sobre', label: 'Sobre', Icone: Info, color: '#A855F7' },
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

const SIGLAS_JURIDICAS = new Set([
  'CF', 'STF', 'STJ', 'TST', 'TSE', 'STM', 'CNJ', 'CNMP', 'OAB', 'CLT', 'CDC',
  'CPC', 'CPP', 'CTN', 'ECA', 'LINDB', 'MP', 'EC', 'LC', 'INSS', 'FGTS', 'SUS',
  'AGU', 'IBAMA', 'BACEN', 'TCU', 'MPU', 'MPE', 'DPU', 'TRF', 'TRT', 'TRE', 'TJ',
  'PF', 'PRF', 'PM', 'PC', 'PGR', 'ADPF', 'ADI', 'ADC', 'ADO', 'HC', 'MS', 'MI',
  'RE', 'RESP', 'RCL', 'SV', 'RG', 'CPF', 'CNPJ', 'LGPD', 'IA', 'TJSP', 'TJRJ',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV',
]);

const CONECTIVOS_PT = new Set([
  'a', 'à', 'ao', 'aos', 'as', 'às', 'com', 'da', 'das', 'de', 'do', 'dos',
  'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'pela',
  'pelas', 'pelo', 'pelos', 'por', 'sem', 'sob', 'sobre',
]);

/**
 * Padroniza títulos de mapas mentais:
 * 1) Remove prefixos numéricos redundantes ("01. ", "02 - ") já exibidos no badge.
 * 2) Converte termos em CAIXA ALTA para Title Case jurídico, preservando siglas e romanos.
 */
export function formatarTituloMapa(raw?: string | null): string {
  if (!raw) return '';
  const semPrefixo = raw.replace(/^\d+[\.\-\s_]+\s*/i, '').trim();
  if (!semPrefixo) return '';

  return semPrefixo
    .split(/\s+/)
    .map((token, idx) => {
      // Trata tokens com barra (ex: CF/88, 9.784/99)
      if (token.includes('/')) {
        return token
          .split('/')
          .map((parte) => {
            const pure = parte.replace(/[^A-Za-zÀ-ÿ]/g, '').toUpperCase();
            if (SIGLAS_JURIDICAS.has(pure)) return parte.toUpperCase();
            return parte;
          })
          .join('/');
      }

      const match = token.match(/^([^A-Za-zÀ-ÿ]*)([A-Za-zÀ-ÿ]+)([^A-Za-zÀ-ÿ]*)$/);
      if (!match) return token;

      const [, prefix, word, suffix] = match;
      const upper = word.toUpperCase();
      const lower = word.toLowerCase();

      if (SIGLAS_JURIDICAS.has(upper)) {
        return `${prefix}${upper}${suffix}`;
      }

      // "Nº" ou "N°" no meio da frase -> "nº"
      if (idx > 0 && (lower === 'n' || lower === 'nº') && (suffix.includes('º') || suffix.includes('°') || lower === 'nº')) {
        return `${prefix}nº${suffix.replace(/[º°]/g, '')}`;
      }

      // Só converte se a palavra estiver toda em maiúsculas (com >= 2 letras) ou se for conectivo em maiúsculas
      const isAllCaps = word === upper && word !== lower;
      if (idx > 0 && CONECTIVOS_PT.has(lower) && (isAllCaps || word === lower)) {
        return `${prefix}${lower}${suffix}`;
      }

      if (isAllCaps && word.length >= 2) {
        return `${prefix}${lower.charAt(0).toUpperCase()}${lower.slice(1)}${suffix}`;
      }

      if (idx === 0) {
        return `${prefix}${word.charAt(0).toUpperCase()}${word.slice(1)}${suffix}`;
      }

      return token;
    })
    .join(' ');
}
