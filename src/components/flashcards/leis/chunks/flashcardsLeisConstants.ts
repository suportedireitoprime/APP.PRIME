import {
  Scale,
  Users,
  Landmark,
  FileText,
  File,
  LucideIcon,
} from 'lucide-react';

export type TemaRow = {
  tema: string;
  total: number;
  estudados?: number;
  compreendidos: number;
  a_revisar: number;
  area?: string;
  nome_curto?: string;
};

export const isLei = (tema: string) => {
  const t = tema.toLowerCase();
  return (
    t.includes('lei') ||
    t.includes('código') ||
    t.includes('estatuto') ||
    t.includes('constituição') ||
    t.includes('cf') ||
    t.includes('súmula') ||
    t.includes('resolução') ||
    t.includes('decreto') ||
    t.includes('clt') ||
    t.includes('cpc') ||
    t.includes('cpp')
  );
};

export const getCategoria = (tema: string) => {
  const t = tema.toLowerCase();
  if (t.includes('código') || t.includes('clt') || t.includes('cpc') || t.includes('cpp'))
    return 'Códigos';
  if (t.includes('estatuto')) return 'Estatutos';
  if (t.includes('constituição') || t.includes('cf')) return 'Constituição';
  if (t.includes('súmula') || t.includes('resolução')) return 'Súmulas e Resoluções';
  if (t.includes('decreto')) return 'Decretos';
  return 'Leis Especiais';
};

export const getBaseArtigo = (art: string) => {
  if (!art || art === 'Geral') return 'Geral';
  const match = art.match(/^\D*(\d+(?:-[a-zA-Z]|[a-zA-Z])?)/);
  if (match) return match[1].toUpperCase();
  return art;
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Direito Penal': Scale,
  'Direito Civil': Users,
  'Direito Constitucional': Landmark,
  'Direito Administrativo': FileText,
  'Direito do Trabalho': File,
  'Direito Processual Penal': Scale,
  'Direito Processual Civil': Scale,
  'Direito Eleitoral': Users,
  'Direito Tributário': FileText,
  'Direito Empresarial': File,
};

export const CATEGORY_ORDER = [
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito do Trabalho',
  'Direito Processual do Trabalho',
  'Direito Tributário',
  'Direito Eleitoral',
  'Direito Empresarial',
];

export const STATUS_LEIS = [
  { id: 'todos', label: 'Todos os Cards' },
  { id: 'novos', label: 'Apenas Novos' },
  { id: 'revisar', label: 'A Revisar' },
];

export const LEIS_CACHE_KEY = 'flashcards_leis_counts_v1';
