-- Migration: create_simulados_estatisticas

CREATE TABLE IF NOT EXISTS public.user_simulados_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    simulado_id UUID NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
    total_questoes INTEGER DEFAULT 0,
    acertos INTEGER DEFAULT 0,
    status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizado')),
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, simulado_id, started_at)
);

CREATE TABLE IF NOT EXISTS public.user_simulados_respostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    historico_id UUID NOT NULL REFERENCES public.user_simulados_historico(id) ON DELETE CASCADE,
    questao_id UUID NOT NULL REFERENCES public.simulado_questions(id) ON DELETE CASCADE,
    disciplina TEXT,
    assunto TEXT,
    acertou BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para user_simulados_historico
ALTER TABLE public.user_simulados_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio histórico"
ON public.user_simulados_historico FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio histórico"
ON public.user_simulados_historico FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio histórico"
ON public.user_simulados_historico FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seu próprio histórico"
ON public.user_simulados_historico FOR DELETE
USING (auth.uid() = user_id);

-- RLS para user_simulados_respostas
ALTER TABLE public.user_simulados_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias respostas"
ON public.user_simulados_respostas FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_simulados_historico
        WHERE user_simulados_historico.id = user_simulados_respostas.historico_id
        AND user_simulados_historico.user_id = auth.uid()
    )
);

CREATE POLICY "Usuários podem inserir suas próprias respostas"
ON public.user_simulados_respostas FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_simulados_historico
        WHERE user_simulados_historico.id = historico_id
        AND user_simulados_historico.user_id = auth.uid()
    )
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_simulados_historico_user ON public.user_simulados_historico(user_id);
CREATE INDEX IF NOT EXISTS idx_simulados_respostas_historico ON public.user_simulados_respostas(historico_id);

-- Grants
GRANT ALL ON TABLE public.user_simulados_historico TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_simulados_respostas TO anon, authenticated, service_role;
