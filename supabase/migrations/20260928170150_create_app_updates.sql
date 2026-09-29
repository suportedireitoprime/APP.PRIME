CREATE TABLE IF NOT EXISTS public.app_updates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL,
  title text NOT NULL,
  date date NOT NULL,
  description text NOT NULL,
  features text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on app_updates"
  ON public.app_updates FOR SELECT
  USING (true);
