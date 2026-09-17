CREATE TABLE public.senado_pautas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_sessao TEXT UNIQUE NOT NULL,
    titulo TEXT,
    descricao TEXT,
    hora_inicio TEXT,
    hora_fim TEXT,
    local TEXT,
    orgaos TEXT,
    situacao TEXT,
    url_registro TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (opcional, mas boa prática)
ALTER TABLE public.senado_pautas ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (já que os dados são públicos)
CREATE POLICY "Permitir leitura publica" 
ON public.senado_pautas FOR SELECT 
TO public 
USING (true);

-- Criar trigger de update
CREATE EXTENSION IF NOT EXISTS moddatetime schema extensions;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.senado_pautas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime (updated_at);
