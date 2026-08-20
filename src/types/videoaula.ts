export type AulaHit = { 
  catalogoId: string; 
  videoId: string; 
  titulo: string; 
  area: string; 
  slugArea: string 
};

export type Aula = {
  id: string | number;
  video_id: string;
  titulo: string;
  area?: string | null;
  descricao?: string | null;
  sobre_aula?: string | null;
  thumb?: string | null;
  thumbnail?: string | null;
  duracao_segundos?: number | null;
};
