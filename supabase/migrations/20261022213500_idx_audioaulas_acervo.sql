-- Cria índice composto em area e sequencia para acelerar consultas e ordenação na tabela audioaulas_acervo
CREATE INDEX IF NOT EXISTS idx_audioaulas_acervo_area_seq ON public.audioaulas_acervo (area, sequencia);
