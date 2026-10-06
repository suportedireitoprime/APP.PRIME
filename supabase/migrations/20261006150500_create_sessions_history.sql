-- Migration: create_sessions_history
-- Description: Tabelas para sincronizar o progresso de sessões ativas de Questões (Lei Seca) e Flashcards

-- 1. questoes_sessoes_historico
CREATE TABLE IF NOT EXISTS public.questoes_sessoes_historico (
    sessao_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_ultimo_acesso TIMESTAMPTZ NOT NULL,
    filtro_aplicado TEXT,
    questoes JSONB NOT NULL DEFAULT '[]'::jsonb,
    respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
    idx INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    contexto TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(sessao_id, user_id)
);

ALTER TABLE public.questoes_sessoes_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own questoes_sessoes" ON public.questoes_sessoes_historico FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own questoes_sessoes" ON public.questoes_sessoes_historico FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questoes_sessoes" ON public.questoes_sessoes_historico FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own questoes_sessoes" ON public.questoes_sessoes_historico FOR DELETE USING (auth.uid() = user_id);

-- 2. flashcards_sessoes_historico
CREATE TABLE IF NOT EXISTS public.flashcards_sessoes_historico (
    sessao_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_ultimo_acesso TIMESTAMPTZ NOT NULL,
    query_string TEXT,
    filtro_aplicado TEXT,
    cards_revisados INTEGER NOT NULL DEFAULT 0,
    total_cards INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(sessao_id, user_id)
);

ALTER TABLE public.flashcards_sessoes_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own flashcards_sessoes" ON public.flashcards_sessoes_historico FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcards_sessoes" ON public.flashcards_sessoes_historico FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards_sessoes" ON public.flashcards_sessoes_historico FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards_sessoes" ON public.flashcards_sessoes_historico FOR DELETE USING (auth.uid() = user_id);
