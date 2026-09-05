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
