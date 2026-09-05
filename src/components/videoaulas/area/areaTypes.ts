import type { ProgressoRow } from '@/lib/videoaulasStore';

export type Aula = {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  ordem?: number | null;
  duracao_segundos?: number | null;
  thumb?: string | null;
  thumbnail?: string | null;
};

export type ProgressoMap = Record<string, { percentual: number; concluida: boolean; tempo_atual?: number | null }>;

export const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export function mapearProgresso(rows: ProgressoRow[] | null, tabela: string): ProgressoMap {
  const map: ProgressoMap = {};
  (rows ?? [])
    .filter((p) => p.tabela === tabela)
    .forEach((p) => {
      map[p.video_id] = {
        percentual: p.percentual ?? 0,
        concluida: !!p.concluida,
        tempo_atual: p.tempo_atual ?? null,
      };
    });
  return map;
}
