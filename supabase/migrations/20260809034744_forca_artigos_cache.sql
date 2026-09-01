-- Criação da tabela de cache para as fases geradas pela IA no Jogo da Forca

CREATE TABLE IF NOT EXISTS public.forca_artigos_cache (
    artigo_id uuid PRIMARY KEY REFERENCES public.vade_mecum_artigos(id) ON DELETE CASCADE,
    phases jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativação de RLS
ALTER TABLE public.forca_artigos_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Permitir leitura para todos (autenticados)
CREATE POLICY "Permitir leitura de cache para usuários autenticados" 
    ON public.forca_artigos_cache FOR SELECT 
    USING ((select auth.role()) = 'authenticated');

-- Bloquear inserção/atualização direta do frontend (apenas Edge Functions via Service Role poderão inserir)
-- Nenhuma política de INSERT/UPDATE criada, logo o default deny cuidará de bloquear.
