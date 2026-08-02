CREATE TABLE public.tematica_maratonas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  template_slug text,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tematica_maratonas TO authenticated;
GRANT ALL ON public.tematica_maratonas TO service_role;

ALTER TABLE public.tematica_maratonas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia suas maratonas"
ON public.tematica_maratonas
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX tematica_maratonas_user_idx ON public.tematica_maratonas (user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.tematica_maratonas_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tematica_maratonas_touch_updated_at
BEFORE UPDATE ON public.tematica_maratonas
FOR EACH ROW EXECUTE FUNCTION public.tematica_maratonas_touch();