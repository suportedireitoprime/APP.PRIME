import {
  Home, Landmark, Building2, Gavel, ShieldCheck, Briefcase, DollarSign, Scale, FileText,
  HeartPulse, Users, Globe, Leaf, Trophy, Hammer, Coins, Swords, Building, Globe2, AlertTriangle,
  GraduationCap, Microscope, BookText, ClipboardList, Award, Lightbulb, Video,
  type LucideIcon,
} from 'lucide-react';
import { slugify } from '@/lib/videoaulasCatalogos';

export type AreaIcon = { Icon: LucideIcon; color: string };

/** Mesmos ícones/cores usados no módulo Aprender. */
export const AREA_ICON_MAP: Record<string, AreaIcon> = {
  'direito-administrativo': { Icon: Landmark, color: '#f97316' },
  'direito-civil': { Icon: Home, color: '#a81f40' },
  'direito-penal': { Icon: Gavel, color: '#c2274a' },
  'direito-constitucional': { Icon: Scale, color: '#3b82f6' },
  'direito-processual-civil': { Icon: FileText, color: '#38bdf8' },
  'direito-processual-penal': { Icon: ShieldCheck, color: '#a78bfa' },
  'direito-tributario': { Icon: DollarSign, color: '#22c55e' },
  'direito-do-trabalho': { Icon: Briefcase, color: '#a81f40' },
  'direito-trabalho': { Icon: Briefcase, color: '#a81f40' },
  'direito-empresarial': { Icon: Building2, color: '#94a3b8' },
  'direito-ambiental': { Icon: Leaf, color: '#10b981' },
  'direitos-humanos': { Icon: Users, color: '#f472b6' },
  'direito-internacional-publico': { Icon: Globe, color: '#0ea5e9' },
  'direito-internacional': { Icon: Globe, color: '#0ea5e9' },
  'direito-previdenciario': { Icon: HeartPulse, color: '#ec4899' },
  'direito-desportivo': { Icon: Trophy, color: '#c2274a' },
  'direito-processual-do-trabalho': { Icon: Hammer, color: '#60a5fa' },
  'direito-financeiro': { Icon: Coins, color: '#c2274a' },
  'direito-concorrencial': { Icon: Swords, color: '#c084fc' },
  'direito-urbanistico': { Icon: Building, color: '#fb923c' },
  'direito-internacional-privado': { Icon: Globe2, color: '#2dd4bf' },
  'direito-consumidor': { Icon: Users, color: '#f59e0b' },
  'direito-do-consumidor': { Icon: Users, color: '#f59e0b' },
  'lei-penal-especial': { Icon: AlertTriangle, color: '#f87171' },
  'legislacao-penal-especial': { Icon: AlertTriangle, color: '#f87171' },
  'formacao-complementar': { Icon: GraduationCap, color: '#fb923c' },
  'pesquisa-cientifica': { Icon: Microscope, color: '#22d3ee' },
  'politicas-publicas': { Icon: Users, color: '#818cf8' },
  portugues: { Icon: BookText, color: '#fb923c' },
  'pratica-profissional': { Icon: ClipboardList, color: '#a8a29e' },
  'revisao-oab': { Icon: Award, color: '#f87171' },
  'teoria-e-filosofia-do-direito': { Icon: Lightbulb, color: '#a5b4fc' },
  etica: { Icon: Award, color: '#f87171' },
  'etica-profissional': { Icon: Award, color: '#f87171' },
};

const FALLBACK: AreaIcon = { Icon: Video, color: '#c2274a' };

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
