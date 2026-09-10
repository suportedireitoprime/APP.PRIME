import {
  Home, Landmark, Building2, Gavel, ShieldCheck, Briefcase, DollarSign, Scale, FileText,
  HeartPulse, Users, Globe, Leaf, Trophy, Hammer, Coins, Swords, Building, Globe2, AlertTriangle,
  GraduationCap, Microscope, BookText, ClipboardList, Award, Lightbulb,
} from 'lucide-react';
import hero1 from '@/assets/aprender-hero/hero-1.png.asset.json';
import hero2 from '@/assets/aprender-hero/hero-2.png.asset.json';
import hero3 from '@/assets/aprender-hero/hero-3.png.asset.json';
import hero4 from '@/assets/aprender-hero/hero-4.png.asset.json';
import hero5 from '@/assets/aprender-hero/hero-5.png.asset.json';
import hero6 from '@/assets/aprender-hero/hero-6.png.asset.json';
import { srcOf } from '@/lib/assetUrl';
import type { AprenderHomeData } from '@/lib/aprenderHomeSnapshot';

export const HERO_ILLUSTRATIONS = [
  srcOf(hero1),
  srcOf(hero2),
  srcOf(hero3),
  srcOf(hero4),
  srcOf(hero5),
  srcOf(hero6),
];

export const AREA_ICON_MAP: Record<string, { Icon: typeof Landmark; color: string }> = {
  'direito-administrativo': { Icon: Landmark, color: '#fb923c' },
  'direito-civil': { Icon: Home, color: '#60a5fa' },
  'direito-penal': { Icon: Gavel, color: '#fb7185' },
  'direito-constitucional': { Icon: Scale, color: '#38bdf8' },
  'direito-processual-civil': { Icon: FileText, color: '#7dd3fc' },
  'direito-processual-penal': { Icon: ShieldCheck, color: '#c084fc' },
  'direito-tributario': { Icon: DollarSign, color: '#4ade80' },
  'direito-do-trabalho': { Icon: Briefcase, color: '#f472b6' },
  'direito-empresarial': { Icon: Building2, color: '#93c5fd' },
  'direito-ambiental': { Icon: Leaf, color: '#34d399' },
  'direitos-humanos': { Icon: Users, color: '#f472b6' },
  'direito-internacional-publico': { Icon: Globe, color: '#38bdf8' },
  'direito-previdenciario': { Icon: HeartPulse, color: '#fb7185' },
  'direito-desportivo': { Icon: Trophy, color: '#fbbf24' },
  'direito-processual-do-trabalho': { Icon: Hammer, color: '#93c5fd' },
  'direito-financeiro': { Icon: Coins, color: '#facc15' },
  'direito-concorrencial': { Icon: Swords, color: '#d8b4fe' },
  'direito-urbanistico': { Icon: Building, color: '#fdba74' },
  'direito-internacional-privado': { Icon: Globe2, color: '#5eead4' },
  'lei-penal-especial': { Icon: AlertTriangle, color: '#fda4af' },
  'formacao-complementar': { Icon: GraduationCap, color: '#fdba74' },
  'pesquisa-cientifica': { Icon: Microscope, color: '#67e8f9' },
  'politicas-publicas': { Icon: Users, color: '#a5b4fc' },
  'portugues': { Icon: BookText, color: '#fdba74' },
  'pratica-profissional': { Icon: ClipboardList, color: '#cbd5e1' },
  'revisao-oab': { Icon: Award, color: '#fda4af' },
  'teoria-e-filosofia-do-direito': { Icon: Lightbulb, color: '#c7d2fe' },
};

export function areaIconFor(slug?: string | null) {
  if (!slug) return null;
  return AREA_ICON_MAP[slug] ?? null;
}

export const EMPTY_HOME_DATA: AprenderHomeData = {
  areas: [],
  emAndamento: [],
  proxima: null,
  totalAulas: 0,
  totalConcluidas: 0,
  pctGeral: 0,
};

export function onIdle(cb: () => void, timeout = 800) {
  const ric: any =
    (typeof window !== 'undefined' && (window as any).requestIdleCallback) ||
    ((fn: any) => setTimeout(fn, timeout));
  return ric(cb, { timeout });
}
