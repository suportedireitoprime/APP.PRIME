CREATE TYPE stf_session_status AS ENUM ('scheduled', 'live', 'finished', 'canceled');

CREATE TABLE public.stf_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  scheduled_at timestamp with time zone NOT NULL,
  status stf_session_status NOT NULL DEFAULT 'scheduled',
  youtube_video_id text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.stf_session_agendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.stf_sessions(id) ON DELETE CASCADE,
  process_number text NOT NULL,
  theme text NOT NULL,
  relator text,
  status text,
  order_index integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indices for performance
CREATE INDEX idx_stf_sessions_scheduled_at ON public.stf_sessions(scheduled_at DESC);
CREATE INDEX idx_stf_sessions_status ON public.stf_sessions(status);
CREATE INDEX idx_stf_session_agendas_session_id ON public.stf_session_agendas(session_id);

-- Turn on RLS
ALTER TABLE public.stf_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stf_session_agendas ENABLE ROW LEVEL SECURITY;

-- Allow public read access (everyone can see the agenda)
CREATE POLICY "Public read access for stf_sessions"
ON public.stf_sessions FOR SELECT USING (true);

CREATE POLICY "Public read access for stf_session_agendas"
ON public.stf_session_agendas FOR SELECT USING (true);

-- Enable Realtime for stf_sessions
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stf_sessions;
