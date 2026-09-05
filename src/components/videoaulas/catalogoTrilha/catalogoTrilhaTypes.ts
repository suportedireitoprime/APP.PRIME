export type CatalogoAula = {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  duracao_segundos?: number | null;
  thumb?: string | null;
  thumbnail?: string | null;
  percentual?: number;
  concluida?: boolean;
};
