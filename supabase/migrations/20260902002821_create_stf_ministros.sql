CREATE TABLE IF NOT EXISTS public.stf_ministros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    nome_completo TEXT,
    foto_url TEXT,
    status TEXT CHECK (status IN ('vigente', 'aposentado', 'falecido')),
    genero TEXT CHECK (genero IN ('M', 'F')),
    data_indicacao DATE,
    data_fim DATE,
    indicado_por TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.stf_ministros ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública
CREATE POLICY "Leitura publica ministros" ON public.stf_ministros FOR SELECT USING (true);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stf_ministros TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stf_ministros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stf_ministros TO service_role;
