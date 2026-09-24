import type { Highlight } from '@/hooks/useHighlights';
import type { PremiumFeatureKey } from '@/components/PremiumGate';

// ─── Interfaces ───

export interface ModificationInfo {
  tipo: string;        // "Incluído", "Alterada", etc.
  referencia: string;  // "Incluído pela Lei Complementar nº 225, de 2026"
  leiNome: string;     // "Lei Complementar nº 225, de 2026"
  parteModificada: string; // "Artigo inteiro", "§ 4º", "Inciso II", etc.
  linhasModificadas: number[]; // indices of modified lines
}

import type { BreadcrumbData } from './artigoBreadcrumbs';
export type { BreadcrumbData };

export interface ArtigoBottomSheetProps {
  artigo: import('@/data/mockData').ArtigoLei | null;
  onClose: () => void;
  isFavorito?: boolean;
  onToggleFavorito?: () => void;
  showNomenJuris?: boolean;
  tabelaNome?: string;
  tabela_nome?: string;
  forceShowRedacao?: boolean;
  modificationInfo?: ModificationInfo | null;
  breadcrumb?: BreadcrumbData | null;
  [key: string]: any;
}

export interface MagicGrifo {
  trechoExato: string;
  cor: 'amarelo' | 'verde' | 'azul' | 'rosa' | 'laranja';
  explicacao: string;
  hierarquia: string;
}

// ─── Constantes ───

// Item 44: Paleta calibrada para dark mode (luminância e contraste harmônico sobre fundo escuro)
export const MAGIC_COLORS: Record<string, string> = {
  amarelo: 'rgba(245, 158, 11, 0.35)',
  verde: 'rgba(16, 185, 129, 0.35)',
  azul: 'rgba(56, 189, 248, 0.35)',
  rosa: 'rgba(244, 63, 94, 0.35)',
  laranja: 'rgba(249, 115, 22, 0.35)',
};

export const MAGIC_LABELS: Record<string, string> = {
  amarelo: 'Chave',
  verde: 'Exceção',
  azul: 'Efeito',
  rosa: 'Termo',
  laranja: 'Pegadinha',
};

/** Deve acompanhar NARRATION_CACHE_VERSION da edge function narrar-artigo */
export const NARRACAO_CACHE_VERSION = 'v6-pronuncia-juridica';

export const GRIFO_IA_DEFAULT_KEY = 'direitoprime:grifoia:default:on';

// ─── Tipografia & Ergonomia de Leitura (Itens 01 e 02) ───

export type VadeMecumFontFamily = 'sans' | 'serif' | 'mono';
export type VadeMecumLineHeight = '1.6' | '1.8' | '2.1';

export const VADEMECUM_FONT_SIZE_KEY = 'vademecum_font_size';
export const VADEMECUM_FONT_FAMILY_KEY = 'vademecum_font_family';
export const VADEMECUM_LINE_HEIGHT_KEY = 'vademecum_line_height';
export const VADEMECUM_BIONIC_READING_KEY = 'vademecum_bionic_reading';
export const VADEMECUM_READING_GUIDE_KEY = 'vademecum_reading_guide';

export const FONT_FAMILY_CLASSES: Record<VadeMecumFontFamily, string> = {
  sans: 'font-sans',
  serif: 'font-vademecum-serif',
  mono: 'font-vademecum-mono',
};

export const LINE_HEIGHT_CLASSES: Record<VadeMecumLineHeight, string> = {
  '1.6': 'leading-[1.6]',
  '1.8': 'leading-[1.8]',
  '2.1': 'leading-[2.1]',
};
