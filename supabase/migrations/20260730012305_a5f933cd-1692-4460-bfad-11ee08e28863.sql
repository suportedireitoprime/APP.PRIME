CREATE TABLE IF NOT EXISTS public.biblioteca_leitura_fila_estado (
  escopo text PRIMARY KEY,
  rodando boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.biblioteca_leitura_fila_estado TO authenticated;
GRANT ALL ON public.biblioteca_leitura_fila_estado TO service_role;

ALTER TABLE public.biblioteca_leitura_fila_estado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem estado da fila"
ON public.biblioteca_leitura_fila_estado FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados criam estado da fila"
ON public.biblioteca_leitura_fila_estado FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Autenticados atualizam estado da fila"
ON public.biblioteca_leitura_fila_estado FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.biblioteca_leitura_fila_estado;
ALTER TABLE public.biblioteca_leitura_fila_estado REPLICA IDENTITY FULL;