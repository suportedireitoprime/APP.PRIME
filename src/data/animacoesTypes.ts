import type { CSSProperties } from 'react';

export interface AnimacaoHomeItem {
  slug: string;
  titulo: string;
  tituloHtml?: string;
  categoria: string;
  artigoRef: string | null;
  exameRef: string | null;
  capaR2Url?: string | null;
}

export interface AnimacaoItem extends AnimacaoHomeItem {
  gabarito: string | null;
  resumo: string;
  tratamentoMd: string;
  htmlR2Url: string;
  audiosR2Urls: string[];
  totalAudios: number;
  driveFolderId: string;
}

export function formatAnimacaoTitulo(titulo: string): string {
  return titulo.replace(/\s*[—–]\s*/g, ': ');
}

export function formatAreaCurta(categoria: string): string {
  return categoria.replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '').trim() || categoria;
}

const AREA_HEX_COLORS: Record<string, { bg: string; border: string }> = {
  'direito civil': { bg: 'rgba(2, 132, 199, 0.92)', border: 'rgba(56, 189, 248, 0.65)' },
  'direito penal': { bg: 'rgba(220, 38, 38, 0.92)', border: 'rgba(248, 113, 113, 0.65)' },
  'direito do consumidor': { bg: 'rgba(5, 150, 105, 0.92)', border: 'rgba(52, 211, 153, 0.65)' },
  'direito constitucional': { bg: 'rgba(79, 70, 229, 0.92)', border: 'rgba(129, 140, 248, 0.65)' },
  'direito processual civil': { bg: 'rgba(124, 58, 237, 0.92)', border: 'rgba(167, 139, 250, 0.65)' },
  'direito processual penal': { bg: 'rgba(234, 88, 12, 0.92)', border: 'rgba(251, 146, 60, 0.65)' },
  'direito processual do trabalho': { bg: 'rgba(13, 148, 136, 0.92)', border: 'rgba(45, 212, 191, 0.65)' },
  'etica profissional': { bg: 'rgba(192, 38, 211, 0.92)', border: 'rgba(232, 121, 249, 0.65)' },
  'direito administrativo': { bg: 'rgba(8, 145, 178, 0.92)', border: 'rgba(34, 211, 238, 0.65)' },
  'direito tributario': { bg: 'rgba(219, 39, 119, 0.92)', border: 'rgba(244, 114, 182, 0.65)' },
  'direito do trabalho': { bg: 'rgba(101, 163, 13, 0.92)', border: 'rgba(163, 230, 53, 0.65)' },
};

const FALLBACK_HEX_COLORS = [
  { bg: 'rgba(2, 132, 199, 0.92)', border: 'rgba(56, 189, 248, 0.65)' },
  { bg: 'rgba(5, 150, 105, 0.92)', border: 'rgba(52, 211, 153, 0.65)' },
  { bg: 'rgba(124, 58, 237, 0.92)', border: 'rgba(167, 139, 250, 0.65)' },
  { bg: 'rgba(234, 88, 12, 0.92)', border: 'rgba(251, 146, 60, 0.65)' },
  { bg: 'rgba(13, 148, 136, 0.92)', border: 'rgba(45, 212, 191, 0.65)' },
  { bg: 'rgba(192, 38, 211, 0.92)', border: 'rgba(232, 121, 249, 0.65)' },
];

export function getAreaBadgeStyle(categoria: string): CSSProperties {
  const key = categoria
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const palette = AREA_HEX_COLORS[key] ?? (() => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return FALLBACK_HEX_COLORS[hash % FALLBACK_HEX_COLORS.length];
  })();
  return {
    backgroundColor: palette.bg,
    borderColor: palette.border,
    color: '#FFFFFF',
  };
}

export function getAreaBadgeClass(_categoria: string): string {
  return 'text-white';
}
