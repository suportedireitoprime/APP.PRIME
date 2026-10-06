-- Migration: create_artigos_user_state
-- Description: Criação das tabelas de estado do usuário (favoritos, anotações e grifos)

-- 1. artigos_favoritos
CREATE TABLE IF NOT EXISTS public.artigos_favoritos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tabela_codigo TEXT NOT NULL,
    numero_artigo TEXT NOT NULL,
    conteudo_preview TEXT,
    artigo_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tabela_codigo, numero_artigo)
);

ALTER TABLE public.artigos_favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own artigos_favoritos" ON public.artigos_favoritos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own artigos_favoritos" ON public.artigos_favoritos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own artigos_favoritos" ON public.artigos_favoritos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own artigos_favoritos" ON public.artigos_favoritos FOR DELETE USING (auth.uid() = user_id);

-- 2. artigos_anotacoes
CREATE TABLE IF NOT EXISTS public.artigos_anotacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tabela_codigo TEXT NOT NULL,
    numero_artigo TEXT NOT NULL,
    artigo_id TEXT NOT NULL,
    anotacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tabela_codigo, numero_artigo)
);

ALTER TABLE public.artigos_anotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own artigos_anotacoes" ON public.artigos_anotacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own artigos_anotacoes" ON public.artigos_anotacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own artigos_anotacoes" ON public.artigos_anotacoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own artigos_anotacoes" ON public.artigos_anotacoes FOR DELETE USING (auth.uid() = user_id);

-- 3. artigos_grifos
CREATE TABLE IF NOT EXISTS public.artigos_grifos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tabela_codigo TEXT NOT NULL,
    numero_artigo TEXT NOT NULL,
    artigo_id TEXT NOT NULL,
    grifos JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tabela_codigo, numero_artigo)
);

ALTER TABLE public.artigos_grifos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own artigos_grifos" ON public.artigos_grifos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own artigos_grifos" ON public.artigos_grifos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own artigos_grifos" ON public.artigos_grifos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own artigos_grifos" ON public.artigos_grifos FOR DELETE USING (auth.uid() = user_id);
