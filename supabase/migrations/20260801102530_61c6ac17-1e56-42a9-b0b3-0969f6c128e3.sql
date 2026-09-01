CREATE TABLE public.questoes_lembretes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  dias text[] NOT NULL DEFAULT ARRAY['seg','ter','qua','qui','sex'],
  horario time NOT NULL DEFAULT '20:00',
  meta_questoes integer NOT NULL DEFAULT 10,
  next_fire_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_lembretes TO authenticated;
GRANT ALL ON public.questoes_lembretes TO service_role;

ALTER TABLE public.questoes_lembretes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own questoes reminders"
ON public.questoes_lembretes FOR ALL TO authenticated
USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

CREATE TRIGGER update_questoes_lembretes_updated_at
BEFORE UPDATE ON public.questoes_lembretes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.location_reminders
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS target_route text;