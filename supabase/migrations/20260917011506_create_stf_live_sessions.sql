CREATE TABLE public.stf_live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    youtube_video_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'live', 'completed')),
    scheduled_start_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.stf_live_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Leitura pública para stf_live_sessions" 
ON public.stf_live_sessions FOR SELECT 
USING (true);

CREATE POLICY "Apenas service_role pode modificar stf_live_sessions" 
ON public.stf_live_sessions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grants
GRANT ALL ON TABLE public.stf_live_sessions TO anon, authenticated, service_role;

-- Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_stf_live_sessions_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stf_live_sessions_updated_at
BEFORE UPDATE ON public.stf_live_sessions
FOR EACH ROW
EXECUTE FUNCTION update_stf_live_sessions_modtime();
