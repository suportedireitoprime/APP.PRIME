CREATE TABLE IF NOT EXISTS public.questoes_acoes_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text NOT NULL,
  tipo text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (chave, tipo)
);

GRANT SELECT ON public.questoes_acoes_cache TO anon;
GRANT SELECT ON public.questoes_acoes_cache TO authenticated;
GRANT ALL ON public.questoes_acoes_cache TO service_role;

ALTER TABLE public.questoes_acoes_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cache de recursos de questões é público para leitura"
ON public.questoes_acoes_cache FOR SELECT USING (true);