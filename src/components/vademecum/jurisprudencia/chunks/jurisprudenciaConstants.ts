import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import horusOwlAsset from '@/assets/horus/horus-owl.png.asset.json';
import { pickAsset, srcOf } from '@/lib/assetUrl';

export const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

export const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export interface JurisItem {
  id: number | string;
  titulo?: string;
  numero_processo?: string;
  conteudo?: string;
  teses?: string[];
  tese?: string;
  ementa?: string;
  descricao?: string;
  situacao?: string | null;
  data_publicacao?: string | null;
  url_origem?: string;
}

export interface JurisCategoria {
  codigo: string;
  label: string;
  tribunal: string;
  itens: JurisItem[];
}

export interface JurisprudenciaArtigoProps {
  slugLeiProp?: string;
  numeroArtigoProp?: string;
  embedded?: boolean;
  onBack?: () => void;
}

export const OVERLAY_STEPS = [
  'Procurando lei no Corpus927',
  'Vinculando automaticamente',
  'Buscando jurisprudência',
  'Pronto',
];

export function tribunalClasses(tribunal: string, active = false) {
  if (tribunal === 'STF') {
    return active
      ? 'bg-blue-600 text-white border-blue-600'
      : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  }
  if (tribunal === 'STJ') {
    return active
      ? 'bg-emerald-600 text-white border-emerald-600'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  }
  return active
    ? 'bg-primary text-primary-foreground border-primary'
    : 'bg-muted text-muted-foreground border-border';
}

export function prettyLeiName(raw: string): string {
  if (!raw) return '';
  if (!/_/.test(raw) && /[a-zàáâãéêíóôõúç]/.test(raw)) return raw;
  const tokens = raw.split('_').filter(Boolean);
  if (tokens.length === 0) return raw;
  const isSigla = (t: string) => /^[A-Z0-9]{2,6}$/.test(t);
  const titleCase = (t: string) =>
    t.toLowerCase().replace(/(^|\s|-)([a-zà-ÿ])/g, (_, p, c) => p + c.toUpperCase());
  const stop = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  const words = tokens.map((t, i) => {
    if (isSigla(t) && i === 0) return t;
    const lower = t.toLowerCase();
    if (stop.has(lower)) return lower;
    return titleCase(t);
  });
  if (isSigla(words[0]) && words.length > 1) {
    return `${words[0]} — ${words.slice(1).join(' ')}`;
  }
  return words.join(' ');
}
