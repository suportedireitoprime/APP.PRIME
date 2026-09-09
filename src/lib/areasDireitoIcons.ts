import {
  Home, Landmark, Building2, Gavel, ShieldCheck, Briefcase, DollarSign, Scale, FileText,
  HeartPulse, Users, Globe, Leaf, Trophy, Hammer, Coins, Swords, Building, Globe2, AlertTriangle,
  GraduationCap, Microscope, BookText, ClipboardList, Award, Lightbulb, Video,
  type LucideIcon,
} from 'lucide-react';
import { slugify } from '@/lib/videoaulasCatalogos';

export type AreaIcon = { Icon: LucideIcon; color: string };

/** Mesmos ícones/cores usados no módulo Aprender — paleta clara e luminosa. */
export const AREA_ICON_MAP: Record<string, AreaIcon> = {
  'direito-administrativo': { Icon: Landmark, color: '#fb923c' },
  'direito-civil': { Icon: Home, color: '#60a5fa' },
  'direito-penal': { Icon: Gavel, color: '#fb7185' },
  'direito-constitucional': { Icon: Scale, color: '#38bdf8' },
  'direito-processual-civil': { Icon: FileText, color: '#7dd3fc' },
  'direito-processual-penal': { Icon: ShieldCheck, color: '#c084fc' },
  'direito-tributario': { Icon: DollarSign, color: '#4ade80' },
  'direito-do-trabalho': { Icon: Briefcase, color: '#f472b6' },
  'direito-trabalho': { Icon: Briefcase, color: '#f472b6' },
  'direito-empresarial': { Icon: Building2, color: '#93c5fd' },
  'direito-ambiental': { Icon: Leaf, color: '#34d399' },
  'direitos-humanos': { Icon: Users, color: '#f472b6' },
  'direito-internacional-publico': { Icon: Globe, color: '#38bdf8' },
  'direito-internacional': { Icon: Globe, color: '#38bdf8' },
  'direito-previdenciario': { Icon: HeartPulse, color: '#fb7185' },
  'direito-desportivo': { Icon: Trophy, color: '#fbbf24' },
  'direito-processual-do-trabalho': { Icon: Hammer, color: '#93c5fd' },
  'direito-financeiro': { Icon: Coins, color: '#facc15' },
  'direito-concorrencial': { Icon: Swords, color: '#d8b4fe' },
  'direito-urbanistico': { Icon: Building, color: '#fdba74' },
  'direito-internacional-privado': { Icon: Globe2, color: '#5eead4' },
  'direito-consumidor': { Icon: Users, color: '#fbbf24' },
  'direito-do-consumidor': { Icon: Users, color: '#fbbf24' },
  'lei-penal-especial': { Icon: AlertTriangle, color: '#fda4af' },
  'legislacao-penal-especial': { Icon: AlertTriangle, color: '#fda4af' },
  'formacao-complementar': { Icon: GraduationCap, color: '#fdba74' },
  'pesquisa-cientifica': { Icon: Microscope, color: '#67e8f9' },
  'politicas-publicas': { Icon: Users, color: '#a5b4fc' },
  portugues: { Icon: BookText, color: '#fdba74' },
  'pratica-profissional': { Icon: ClipboardList, color: '#cbd5e1' },
  'revisao-oab': { Icon: Award, color: '#fda4af' },
  'teoria-e-filosofia-do-direito': { Icon: Lightbulb, color: '#c7d2fe' },
  etica: { Icon: Award, color: '#fda4af' },
  'etica-profissional': { Icon: Award, color: '#fda4af' },
};

const FALLBACK: AreaIcon = { Icon: Video, color: '#fb7185' };

/** Casa o nome (ou slug) da área com o ícone correspondente. */
export function areaIconFor(nomeOuSlug?: string | null): AreaIcon {
  if (!nomeOuSlug) return FALLBACK;
  const slug = slugify(nomeOuSlug);
  if (AREA_ICON_MAP[slug]) return AREA_ICON_MAP[slug];
  const parcial = Object.keys(AREA_ICON_MAP).find(
    (k) => slug.includes(k) || k.includes(slug),
  );
  return parcial ? AREA_ICON_MAP[parcial] : FALLBACK;
}

export type AreaThemePalette = {
  primary: string;
  cardGradient: string;
  shadow: string;
  hoverShadow: string;
  lineGradient: string;
  dashedBorder: string;
  nodeBoxShadow: string;
  pingBg: string;
  badgeBg: string;
  badgeBorder: string;
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c || 'fb7185', 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getAreaThemePalette(nomeOuSlug?: string | null): AreaThemePalette {
  const { color } = areaIconFor(nomeOuSlug);
  const { r, g, b } = hexToRgb(color);

  // Gradiente cinematográfico de capa de livro harmonizado com a cor da matéria:
  const midR = Math.round(r * 0.45);
  const midG = Math.round(g * 0.45);
  const midB = Math.round(b * 0.45);

  const darkR = Math.round(r * 0.22);
  const darkG = Math.round(g * 0.22);
  const darkB = Math.round(b * 0.22);

  return {
    primary: color,
    cardGradient: `linear-gradient(145deg, rgba(${r}, ${g}, ${b}, 0.95) 0%, rgba(${midR}, ${midG}, ${midB}, 0.98) 55%, rgba(${darkR}, ${darkG}, ${darkB}, 1) 100%)`,
    shadow: `0 12px 28px -6px rgba(${r}, ${g}, ${b}, 0.45)`,
    hoverShadow: `0 16px 32px -6px rgba(${r}, ${g}, ${b}, 0.65)`,
    lineGradient: `linear-gradient(to bottom, rgba(${r}, ${g}, ${b}, 0.95) 0%, rgba(${r}, ${g}, ${b}, 0.35) 50%, rgba(39, 39, 42, 0.8) 100%)`,
    dashedBorder: `rgba(${r}, ${g}, ${b}, 0.6)`,
    nodeBoxShadow: `0 0 16px rgba(${r}, ${g}, ${b}, 0.85)`,
    pingBg: `rgba(${r}, ${g}, ${b}, 0.45)`,
    badgeBg: `rgba(${r}, ${g}, ${b}, 0.15)`,
    badgeBorder: `rgba(${r}, ${g}, ${b}, 0.35)`,
  };
}

