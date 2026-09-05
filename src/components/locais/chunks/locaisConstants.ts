import type { CategoriaLocal } from '@/lib/locaisCategorias';

export interface Local {
  id: string;
  osm_id: string | null;
  categoria: string;
  nome: string;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  lat: number;
  lng: number;
  telefone: string | null;
  site: string | null;
  horario: any;
  fonte: string | null;
  dist_km?: number | null;
}

export type Contagens = Partial<Record<CategoriaLocal, number>>;

export const categoriaColorClass: Record<CategoriaLocal, string> = {
  tribunais: 'bg-primary/10 text-primary border-primary/25',
  cartorios: 'bg-secondary/80 text-secondary-foreground border-border',
  delegacias: 'bg-muted text-foreground border-border',
  presidios: 'bg-muted text-muted-foreground border-border',
  museus: 'bg-accent text-accent-foreground border-border',
  universidades: 'bg-primary/10 text-primary border-primary/20',
  oab: 'bg-destructive/10 text-destructive border-destructive/20',
  defensoria: 'bg-secondary text-secondary-foreground border-border',
  ministerio_publico: 'bg-primary/10 text-primary border-primary/20',
};

export function formatKm(km?: number | null) {
  if (typeof km !== 'number') return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}
