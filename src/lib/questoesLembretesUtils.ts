import { Briefcase, Building2, GraduationCap, Home, MapPin } from 'lucide-react';

export const DIAS = [
  { id: 'seg', label: 'S', full: 'Seg' },
  { id: 'ter', label: 'T', full: 'Ter' },
  { id: 'qua', label: 'Q', full: 'Qua' },
  { id: 'qui', label: 'Q', full: 'Qui' },
  { id: 'sex', label: 'S', full: 'Sex' },
  { id: 'sab', label: 'S', full: 'Sáb' },
  { id: 'dom', label: 'D', full: 'Dom' },
];

export const WEEKDAY_MAP: Record<string, number> = {
  dom: 1, seg: 2, ter: 3, qua: 4, qui: 5, sex: 6, sab: 7,
};

const DIA_IDX: Record<string, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
};

export const PRESETS: { label: string; dias: string[] }[] = [
  { label: 'Todos os dias', dias: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] },
  { label: 'Dias úteis', dias: ['seg', 'ter', 'qua', 'qui', 'sex'] },
  { label: 'Fim de semana', dias: ['sab', 'dom'] },
];

export const METAS = [5, 10, 20, 30, 50];

export const LOCAIS = [
  { id: 'Casa', icon: Home },
  { id: 'Faculdade', icon: GraduationCap },
  { id: 'Estágio', icon: Briefcase },
  { id: 'Trabalho', icon: Building2 },
  { id: 'Outro', icon: MapPin },
];

export const RADII = [100, 300, 500, 1000];

export interface LocalRow {
  id: string;
  label: string;
  address: string | null;
  radius_m: number;
  active: boolean;
}

/** Próximo disparo (fuso do aparelho) a partir dos dias + hora. */
export function proximoDisparo(dias: string[], horario: string): Date | null {
  const idxs = (dias || []).map((d) => DIA_IDX[d]).filter((n) => n !== undefined);
  if (!idxs.length) return null;
  const [hh, mm] = horario.split(':').map(Number);
  const now = new Date();
  for (let add = 0; add <= 8; add++) {
    const d = new Date(now.getTime() + add * 86400000);
    if (!idxs.includes(d.getDay())) continue;
    const fire = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm, 0, 0);
    if (fire.getTime() > now.getTime()) return fire;
  }
  return null;
}

export function formatarProximo(d: Date | null): string | null {
  if (!d) return null;
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const amanha = new Date(hoje.getTime() + 86400000).toDateString() === d.toDateString();
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (mesmoDia) return `hoje às ${hora}`;
  if (amanha) return `amanhã às ${hora}`;
  return `${d.toLocaleDateString('pt-BR', { weekday: 'long' })} às ${hora}`;
}
