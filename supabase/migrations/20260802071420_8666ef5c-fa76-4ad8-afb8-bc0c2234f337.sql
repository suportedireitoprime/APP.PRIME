ALTER TABLE public.biblioteca_leitura_progresso
  ADD COLUMN IF NOT EXISTS total_paginas integer,
  ADD COLUMN IF NOT EXISTS total_ocr integer,
  ADD COLUMN IF NOT EXISTS read_time_ms bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS titulo text,
  ADD COLUMN IF NOT EXISTS autor text,
  ADD COLUMN IF NOT EXISTS capa text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.biblioteca_leitura_progresso TO authenticated;
GRANT ALL ON public.biblioteca_leitura_progresso TO service_role;