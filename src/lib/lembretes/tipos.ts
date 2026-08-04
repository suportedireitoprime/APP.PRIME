import { BookOpen, ListChecks, MapPin, Scale, Video, NotebookText, BellRing } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Tipos de lembrete da Central.
 *
 * Leitura, questões, lei seca, estudo e local têm tabelas próprias.
 * Videoaulas, resumos e lembretes livres ("geral") são guardados na tabela
 * `avisos` (título + mensagem + data/hora + recorrência). Como `avisos` não tem
 * coluna de tipo, o tipo é gravado como uma tag no fim da mensagem
 * (`#lembrete:videoaulas`), invisível para o usuário.
 */
export type LembreteTipo =
  | 'estudo'
  | 'local'
  | 'leitura'
  | 'videoaulas'
  | 'resumos'
  | 'questoes'
  | 'leiseca'
  | 'geral';

export const TIPOS: Record<
  LembreteTipo,
  { label: string; desc: string; icon: LucideIcon; cor: string; rota: string }
> = {
  geral: {
    label: 'Meus lembretes',
    desc: 'Lembrar de algo em um dia e hora',
    icon: BellRing,
    cor: '#F59E0B',
    rota: '/lembretes/meus',
  },
  leitura: {
    label: 'Leitura',
    desc: 'Livros e biblioteca',
    icon: BookOpen,
    cor: '#3B82F6',
    rota: '/lembretes/leitura',
  },
  videoaulas: {
    label: 'Videoaulas',
    desc: 'Assistir aula no horário certo',
    icon: Video,
    cor: '#EF4468',
    rota: '/lembretes/videoaulas',
  },
  resumos: {
    label: 'Resumos',
    desc: 'Revisar resumos por tema',
    icon: NotebookText,
    cor: '#22D3EE',
    rota: '/lembretes/resumos',
  },
  questoes: {
    label: 'Questões',
    desc: 'Metas de questões para praticar',
    icon: ListChecks,
    cor: '#EC4899',
    rota: '/lembretes/questoes',
  },
  leiseca: {
    label: 'Lei Seca',
    desc: 'Prática da lei seca',
    icon: Scale,
    cor: '#F97316',
    rota: '/lei-seca/lembretes',
  },
  local: {
    label: 'Geolocalização',
    desc: 'Lembretes por local',
    icon: MapPin,
    cor: '#22C55E',
    rota: '/lembretes/local',
  },
  estudo: {
    label: 'Estudo diário',
    desc: 'Alarme de estudo recorrente',
    icon: BellRing,
    cor: '#A855F7',
    rota: '/ajustes/lembretes',
  },
};

/** Tipos guardados na tabela `avisos`. */
export const TIPOS_AVISO: LembreteTipo[] = ['videoaulas', 'resumos', 'geral'];

const TAG = '#lembrete:';

export function marcarTipo(mensagem: string | null, tipo: LembreteTipo): string {
  const base = (mensagem ?? '').trim();
  return base ? `${base}\n\n${TAG}${tipo}` : `${TAG}${tipo}`;
}

export function lerTipo(mensagem: string | null): LembreteTipo {
  const m = (mensagem ?? '').match(/#lembrete:([a-z]+)/);
  const t = m?.[1] as LembreteTipo | undefined;
  return t && TIPOS_AVISO.includes(t) ? t : 'geral';
}

export function limparMensagem(mensagem: string | null): string {
  return (mensagem ?? '').replace(/#lembrete:[a-z]+/g, '').trim();
}

export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function fmtDias(dias?: (number | string)[] | null): string {
  if (!dias?.length) return 'Todos os dias';
  if (dias.length === 7) return 'Todos os dias';
  const mapaTexto: Record<string, string> = {
    dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb',
  };
  return dias
    .map((d) => (typeof d === 'number' ? DIAS_CURTOS[d] : mapaTexto[String(d).toLowerCase()]))
    .filter(Boolean)
    .join(', ');
}

export const RECORRENCIAS = [
  { id: 'unica', label: 'Uma vez' },
  { id: 'diaria', label: 'Todos os dias' },
  { id: 'semanal', label: 'Toda semana' },
  { id: 'mensal', label: 'Todo mês' },
] as const;

export function fmtRecorrencia(rec?: string | null) {
  return RECORRENCIAS.find((r) => r.id === (rec || 'unica'))?.label ?? 'Uma vez';
}

export function fmtDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
