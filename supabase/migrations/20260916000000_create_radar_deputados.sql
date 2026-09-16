CREATE TABLE IF NOT EXISTS public.radar_deputados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camara_id BIGINT UNIQUE,
    nome TEXT NOT NULL,
    sigla_partido TEXT,
    sigla_uf TEXT,
    foto_url TEXT,
    email TEXT,
    dados_json JSONB
);

-- Habilitar RLS
ALTER TABLE public.radar_deputados ENABLE ROW LEVEL SECURITY;

-- Permite leitura de qualquer pessoa (já que os dados são públicos)
CREATE POLICY "Leitura pública deputados" ON public.radar_deputados 
FOR SELECT USING (true);

-- Permite gravação apenas pelo Service Role Key
CREATE POLICY "Admin full access deputados" ON public.radar_deputados 
USING (auth.role() = 'service_role');
