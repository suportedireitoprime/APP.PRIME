CREATE TABLE public.videoaulas_oab_segunda_fase (
  id BIGINT PRIMARY KEY,
  video_id TEXT NOT NULL,
  area TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  sobre_aula TEXT,
  thumbnail TEXT,
  ordem INTEGER,
  duracao_segundos INTEGER,
  publicado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.videoaulas_oab_segunda_fase TO anon;
GRANT SELECT ON public.videoaulas_oab_segunda_fase TO authenticated;
GRANT ALL ON public.videoaulas_oab_segunda_fase TO service_role;

ALTER TABLE public.videoaulas_oab_segunda_fase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videoaulas OAB 2a fase sao publicas"
ON public.videoaulas_oab_segunda_fase
FOR SELECT
USING (true);

CREATE TRIGGER update_videoaulas_oab_segunda_fase_updated_at
BEFORE UPDATE ON public.videoaulas_oab_segunda_fase
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_videoaulas_oab_segunda_fase_area ON public.videoaulas_oab_segunda_fase (area, ordem);