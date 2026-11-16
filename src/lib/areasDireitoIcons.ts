import {
  Home, Landmark, Building2, Gavel, ShieldCheck, Briefcase, DollarSign, Scale, FileText,
  HeartPulse, Users, Globe, Leaf, Trophy, Hammer, Coins, Swords, Building, Globe2, AlertTriangle,
  GraduationCap, Microscope, BookText, ClipboardList, Award, Lightbulb, Video,
  type LucideIcon,
} from 'lucide-react';
import { slugify } from '@/lib/videoaulasCatalogos';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';

export type AreaIcon = { Icon: LucideIcon; color: string };

/** Mesmos ícones/cores oficiais usados no módulo de Aulas Interativas (disciplinasTheme). */
export const AREA_ICON_MAP: Record<string, AreaIcon> = {
  'direito-administrativo': { Icon: Landmark, color: '#ea580c' },
  administrativo: { Icon: Landmark, color: '#ea580c' },
  'direito-civil': { Icon: Home, color: '#3b82f6' },
  civil: { Icon: Home, color: '#3b82f6' },
  'direito-penal': { Icon: Gavel, color: '#dc2626' },
  penal: { Icon: Gavel, color: '#dc2626' },
  'direito-constitucional': { Icon: Scale, color: '#2563eb' },
  constitucional: { Icon: Scale, color: '#2563eb' },
  'direito-processual-civil': { Icon: FileText, color: '#0891b2' },
  'processual-civil': { Icon: FileText, color: '#0891b2' },
  'direito-processual-penal': { Icon: ShieldCheck, color: '#e11d48' },
  'processual-penal': { Icon: ShieldCheck, color: '#e11d48' },
  'direito-tributario': { Icon: DollarSign, color: '#16a34a' },
  tributario: { Icon: DollarSign, color: '#16a34a' },
  'direito-do-trabalho': { Icon: Briefcase, color: '#9333ea' },
  'direito-trabalho': { Icon: Briefcase, color: '#9333ea' },
  trabalho: { Icon: Briefcase, color: '#9333ea' },
  'direito-empresarial': { Icon: Building2, color: '#4f46e5' },
  'direito-ambiental': { Icon: Leaf, color: '#059669' },
  'direitos-humanos': { Icon: Users, color: '#d97706' },
  'direito-internacional-publico': { Icon: Globe, color: '#0d9488' },
  'direito-internacional': { Icon: Globe, color: '#0d9488' },
  'direito-previdenciario': { Icon: HeartPulse, color: '#ca8a04' },
  'direito-desportivo': { Icon: Trophy, color: '#fbbf24' },
  'direito-processual-do-trabalho': { Icon: Hammer, color: '#7c3aed' },
  'direito-financeiro': { Icon: Coins, color: '#65a30d' },
  'direito-concorrencial': { Icon: Swords, color: '#d8b4fe' },
  'direito-urbanistico': { Icon: Building, color: '#fdba74' },
  'direito-internacional-privado': { Icon: Globe2, color: '#0d9488' },
  'direito-consumidor': { Icon: Users, color: '#06b6d4' },
  'direito-do-consumidor': { Icon: Users, color: '#06b6d4' },
  'lei-penal-especial': { Icon: AlertTriangle, color: '#fda4af' },
  'legislacao-penal-especial': { Icon: AlertTriangle, color: '#fda4af' },
  'formacao-complementar': { Icon: GraduationCap, color: '#fdba74' },
  'pesquisa-cientifica': { Icon: Microscope, color: '#67e8f9' },
  'politicas-publicas': { Icon: Users, color: '#a5b4fc' },
  portugues: { Icon: BookText, color: '#fdba74' },
  'pratica-profissional': { Icon: ClipboardList, color: '#cbd5e1' },
  'revisao-oab': { Icon: Award, color: '#fda4af' },
  'teoria-e-filosofia-do-direito': { Icon: Lightbulb, color: '#d4b996' },
  filosofia: { Icon: Lightbulb, color: '#d4b996' },
  'filosofia-do-direito': { Icon: Lightbulb, color: '#d4b996' },
  etica: { Icon: Award, color: '#fda4af' },
  'etica-profissional': { Icon: Award, color: '#fda4af' },
};

const FALLBACK: AreaIcon = { Icon: Video, color: '#ea580c' };

/** Casa o nome (ou slug) da área com o ícone correspondente e a cor oficial de Aulas Interativas. */
export function areaIconFor(nomeOuSlug?: string | null): AreaIcon {
  if (!nomeOuSlug) return FALLBACK;
  const slug = slugify(nomeOuSlug);
  const base = AREA_ICON_MAP[slug] || (() => {
    const parcial = Object.keys(AREA_ICON_MAP).find(
      (k) => slug.includes(k) || k.includes(slug),
    );
    return parcial ? AREA_ICON_MAP[parcial] : FALLBACK;
  })();

  // Harmonização absoluta com as cores oficiais de Aulas (disciplinasTheme)
  const discTheme = getDisciplinaVisualTheme(nomeOuSlug);
  const corOficial = discTheme?.primary || base.color;

  return {
    Icon: base.Icon,
    color: corOficial,
  };
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

