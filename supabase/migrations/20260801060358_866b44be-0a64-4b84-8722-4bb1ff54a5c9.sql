CREATE TABLE public.resumo_metodologias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resumo_id uuid NOT NULL REFERENCES public.resumos_juridicos(id) ON DELETE CASCADE,
  metodo text NOT NULL CHECK (metodo IN ('cornell','feynman')),
  conteudo jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX resumo_metodologias_resumo_metodo_key ON public.resumo_metodologias (resumo_id, metodo);

GRANT SELECT ON public.resumo_metodologias TO anon;
GRANT SELECT ON public.resumo_metodologias TO authenticated;
GRANT ALL ON public.resumo_metodologias TO service_role;

ALTER TABLE public.resumo_metodologias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Metodologias sao publicas para leitura"
ON public.resumo_metodologias FOR SELECT
USING (true);