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

export interface ArtigoBottomSheetProps {
  artigo: import('@/data/mockData').ArtigoLei | null;
  onClose: () => void;
  isFavorito?: boolean;
  onToggleFavorito?: () => void;
  showNomenJuris?: boolean;
  tabelaNome?: string;
  forceShowRedacao?: boolean;
  modificationInfo?: ModificationInfo | null;
  breadcrumb?: { parte?: string; titulo?: string; tituloDesc?: string } | null;
}

export interface MagicGrifo {
  trechoExato: string;
  cor: 'amarelo' | 'verde' | 'azul' | 'rosa' | 'laranja';
  explicacao: string;
  hierarquia: string;
}

// ─── Constantes ───

export const MAGIC_COLORS: Record<string, string> = {
  amarelo: 'rgba(220,38,38, 0.55)',
  verde: 'rgba(34, 197, 94, 0.55)',
  azul: 'rgba(59, 130, 246, 0.55)',
  rosa: 'rgba(236, 72, 153, 0.55)',
  laranja: 'rgba(220,38,38, 0.55)',
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
