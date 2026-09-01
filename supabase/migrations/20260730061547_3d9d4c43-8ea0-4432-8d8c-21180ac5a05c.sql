CREATE TABLE IF NOT EXISTS public.user_last_location (
  user_id UUID NOT NULL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  source TEXT NOT NULL DEFAULT 'app',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_last_location TO authenticated;
GRANT ALL ON public.user_last_location TO service_role;

ALTER TABLE public.user_last_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_last_location_select" ON public.user_last_location
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "own_last_location_insert" ON public.user_last_location
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "own_last_location_update" ON public.user_last_location
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_user_last_location_updated ON public.user_last_location (updated_at DESC);

CREATE TABLE IF NOT EXISTS public.location_reminder_events (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL,
  user_id UUID NOT NULL,
  distance_m DOUBLE PRECISION,
  channel TEXT NOT NULL DEFAULT 'push',
  origin TEXT NOT NULL DEFAULT 'server',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.location_reminder_events TO authenticated;
GRANT ALL ON public.location_reminder_events TO service_role;

ALTER TABLE public.location_reminder_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_location_events_select" ON public.location_reminder_events
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_location_reminder_events_user ON public.location_reminder_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_reminders_active ON public.location_reminders (active) WHERE active;