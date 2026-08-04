ALTER TABLE public.apresentacoes_narradas
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'livro',
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS tema TEXT,
  ADD COLUMN IF NOT EXISTS subtema TEXT,
  ADD COLUMN IF NOT EXISTS referencia_id TEXT,
  ADD COLUMN IF NOT EXISTS referencia_texto TEXT;

CREATE INDEX IF NOT EXISTS apresentacoes_narradas_origem_idx
  ON public.apresentacoes_narradas (origem, area, tema);

GRANT SELECT ON public.apresentacoes_narradas TO anon;
GRANT SELECT ON public.apresentacoes_narradas TO authenticated;
GRANT ALL ON public.apresentacoes_narradas TO service_role;
