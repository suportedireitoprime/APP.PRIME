-- Tabela para persistência oficial do progresso de aulas em trilhas
CREATE TABLE IF NOT EXISTS public.aulas_trilhas_progresso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    aula_id TEXT NOT NULL,
    disciplina_id TEXT NOT NULL,
    materia_id TEXT NOT NULL,
    etapa_atual INTEGER NOT NULL DEFAULT 0,
    total_etapas INTEGER NOT NULL DEFAULT 0,
    aula_terminada BOOLEAN NOT NULL DEFAULT FALSE,
    flashcards_revisados BOOLEAN NOT NULL DEFAULT FALSE,
    questoes_praticadas BOOLEAN NOT NULL DEFAULT FALSE,
    acertos_questoes INTEGER NOT NULL DEFAULT 0,
    total_questoes INTEGER NOT NULL DEFAULT 0,
    tempo_estudo_segundos INTEGER NOT NULL DEFAULT 0,
    concluida_em TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_aula_progresso UNIQUE(user_id, aula_id)
);

-- Tabela para persistência oficial de favoritos de aulas em trilhas
CREATE TABLE IF NOT EXISTS public.aulas_trilhas_favoritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    aula_id TEXT NOT NULL,
    disciplina_id TEXT NOT NULL,
    materia_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_aula_favorito UNIQUE(user_id, aula_id)
);

-- Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_aulas_trilhas_progresso_user ON public.aulas_trilhas_progresso(user_id);
CREATE INDEX IF NOT EXISTS idx_aulas_trilhas_progresso_aula ON public.aulas_trilhas_progresso(aula_id);
CREATE INDEX IF NOT EXISTS idx_aulas_trilhas_progresso_disc ON public.aulas_trilhas_progresso(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_aulas_trilhas_progresso_mat ON public.aulas_trilhas_progresso(materia_id);

CREATE INDEX IF NOT EXISTS idx_aulas_trilhas_favoritos_user ON public.aulas_trilhas_favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_aulas_trilhas_favoritos_aula ON public.aulas_trilhas_favoritos(aula_id);

-- Grants
GRANT ALL ON public.aulas_trilhas_progresso TO anon, authenticated, service_role;
GRANT ALL ON public.aulas_trilhas_favoritos TO anon, authenticated, service_role;

-- RLS
ALTER TABLE public.aulas_trilhas_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas_trilhas_favoritos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia seu próprio progresso de trilhas" ON public.aulas_trilhas_progresso;
CREATE POLICY "Usuário gerencia seu próprio progresso de trilhas" ON public.aulas_trilhas_progresso
    FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Usuário gerencia seus favoritos de trilhas" ON public.aulas_trilhas_favoritos;
CREATE POLICY "Usuário gerencia seus favoritos de trilhas" ON public.aulas_trilhas_favoritos
    FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

