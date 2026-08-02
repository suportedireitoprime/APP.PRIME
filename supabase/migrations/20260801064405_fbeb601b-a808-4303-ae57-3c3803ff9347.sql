ALTER TABLE public.resumos_juridicos
  ADD COLUMN IF NOT EXISTS tabela_codigo text,
  ADD COLUMN IF NOT EXISTS numero_artigo text;

CREATE UNIQUE INDEX IF NOT EXISTS resumos_juridicos_artigo_key
  ON public.resumos_juridicos (tabela_codigo, numero_artigo)
  WHERE tabela_codigo IS NOT NULL AND numero_artigo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resumos_tabela_codigo
  ON public.resumos_juridicos (tabela_codigo);