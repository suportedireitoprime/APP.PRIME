-- Adicionar colunas ricas na tabela de concursos existentes
ALTER TABLE public.concursos_noticias 
ADD COLUMN IF NOT EXISTS pci_id BIGINT,
ADD COLUMN IF NOT EXISTS uf TEXT,
ADD COLUMN IF NOT EXISTS regiao TEXT,
ADD COLUMN IF NOT EXISTS cargos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cargos_resumo TEXT,
ADD COLUMN IF NOT EXISTS vagas_salario TEXT,
ADD COLUMN IF NOT EXISTS formacao TEXT,
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_fim DATE,
ADD COLUMN IF NOT EXISTS dias_restantes INTEGER;

-- Índices para buscas rápidas no app
CREATE INDEX IF NOT EXISTS idx_concursos_noticias_uf ON public.concursos_noticias(uf);
CREATE INDEX IF NOT EXISTS idx_concursos_noticias_regiao ON public.concursos_noticias(regiao);
CREATE INDEX IF NOT EXISTS idx_concursos_noticias_dias ON public.concursos_noticias(dias_restantes);
CREATE INDEX IF NOT EXISTS idx_concursos_noticias_pci_id ON public.concursos_noticias(pci_id);

-- Tabela para guardar os alertas personalizados configurados pelo usuário
CREATE TABLE IF NOT EXISTS public.usuario_alertas_concursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ufs TEXT[] DEFAULT '{}',
    cargos TEXT[] DEFAULT '{}',
    formacao TEXT DEFAULT 'Todos',
    notificar_push BOOLEAN DEFAULT true,
    notificar_horus BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_alerta UNIQUE (user_id)
);

ALTER TABLE public.usuario_alertas_concursos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "usuario_alertas_select_own" ON public.usuario_alertas_concursos;
    DROP POLICY IF EXISTS "usuario_alertas_insert_own" ON public.usuario_alertas_concursos;
    DROP POLICY IF EXISTS "usuario_alertas_update_own" ON public.usuario_alertas_concursos;
    DROP POLICY IF EXISTS "usuario_alertas_all_own" ON public.usuario_alertas_concursos;
END $$;

CREATE POLICY "usuario_alertas_all_own" ON public.usuario_alertas_concursos
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Conceder permissões para authenticated e anon
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuario_alertas_concursos TO authenticated;
GRANT SELECT ON public.usuario_alertas_concursos TO anon;
