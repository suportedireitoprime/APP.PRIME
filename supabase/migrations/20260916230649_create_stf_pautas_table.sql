CREATE TABLE public.stf_pautas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modalidade TEXT NOT NULL,
    data_sessao TEXT,
    orgao_julgador TEXT,
    processo TEXT,
    relator TEXT,
    partes TEXT,
    tema_repercussao TEXT,
    resumo TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (opcional, mas boa prática)
ALTER TABLE public.stf_pautas ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (já que os dados são públicos)
CREATE POLICY "Permitir leitura publica" 
ON public.stf_pautas FOR SELECT 
TO public 
USING (true);

-- Criar trigger de update
CREATE EXTENSION IF NOT EXISTS moddatetime schema extensions;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.stf_pautas
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime (updated_at);
