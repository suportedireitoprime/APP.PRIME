export interface AnimacaoItem {
  slug: string;
  titulo: string;
  tituloHtml?: string;
  categoria: string;
  gabarito: string | null;
  artigoRef: string | null;
  exameRef: string | null;
  resumo: string;
  tratamentoMd: string;
  htmlR2Url: string;
  capaR2Url?: string | null;
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

const AREA_BADGE_COLORS: Record<string, string> = {
  'direito civil': 'bg-sky-600/90 border-sky-400/50 text-white',
  'direito penal': 'bg-red-600/90 border-red-400/50 text-white',
  'direito do consumidor': 'bg-emerald-600/90 border-emerald-400/50 text-white',
  'direito processual civil': 'bg-violet-600/90 border-violet-400/50 text-white',
  'direito processual penal': 'bg-orange-600/90 border-orange-400/50 text-white',
  'direito processual do trabalho': 'bg-teal-600/90 border-teal-400/50 text-white',
  'direito constitucional': 'bg-indigo-600/90 border-indigo-400/50 text-white',
  'direito administrativo': 'bg-cyan-600/90 border-cyan-400/50 text-white',
  'direito tributario': 'bg-pink-600/90 border-pink-400/50 text-white',
  'direito do trabalho': 'bg-lime-600/90 border-lime-400/50 text-white',
};

const FALLBACK_BADGE_COLORS = [
  'bg-sky-600/90 border-sky-400/50 text-white',
  'bg-emerald-600/90 border-emerald-400/50 text-white',
  'bg-violet-600/90 border-violet-400/50 text-white',
  'bg-orange-600/90 border-orange-400/50 text-white',
  'bg-teal-600/90 border-teal-400/50 text-white',
  'bg-pink-600/90 border-pink-400/50 text-white',
];

export function getAreaBadgeClass(categoria: string): string {
  const key = categoria
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (AREA_BADGE_COLORS[key]) return AREA_BADGE_COLORS[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACK_BADGE_COLORS[hash % FALLBACK_BADGE_COLORS.length];
}
