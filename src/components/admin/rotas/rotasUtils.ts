import { Activity, CornerDownRight, Flame, Gauge, Zap } from 'lucide-react';
import type { RouteWeightLevel } from '@/data/appRoutesCatalog';

export type ViewMode =
  | 'agrupadas'
  | 'bugs'
  | 'pouco_usadas'
  | 'pesadas'
  | 'todas'
  | 'ativas'
  | 'redirects'
  | 'admin'
  | 'publicas';

export type SortBy = 'alfabetica' | 'peso';

export function getWeightBadge(level: RouteWeightLevel, estimate: string) {
  switch (level) {
    case 'muito_pesada':
      return {
        label: 'Muito Pesada',
        estimate,
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
        dotClass: 'bg-red-500 animate-pulse',
        icon: Flame,
      };
    case 'pesada':
      return {
        label: 'Pesada',
        estimate,
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        dotClass: 'bg-orange-500',
        icon: Gauge,
      };
    case 'media':
      return {
        label: 'Média',
        estimate,
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500',
        icon: Activity,
      };
    case 'leve':
      return {
        label: 'Leve',
        estimate,
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        icon: Zap,
      };
    case 'zero':
    default:
      return {
        label: 'Zero',
        estimate: '0 KB',
        badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        dotClass: 'bg-zinc-600',
        icon: CornerDownRight,
      };
  }
}
