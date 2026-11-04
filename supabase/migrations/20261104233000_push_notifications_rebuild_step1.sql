-- ==============================================================================
-- MIGRATION: 20261104233000_push_notifications_rebuild_step1.sql
-- OBJETIVO: Reconstrução do ecossistema de Push Notifications (Passo 1 - Banco de Dados)
-- 1. Campos de isolamento de Admin e versão em device_tokens
-- 2. Tabela oficial user_notifications (Central de Notificações real por usuário)
-- 3. Tabela oficial user_push_preferences (Opt-in por categoria)
-- 4. Função RPC is_admin_user atualizada e segura
-- ==============================================================================

-- 1. Atualizar device_tokens com flags de identificação de dispositivo e versão
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS is_admin_device BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS app_version TEXT;
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();

-- Índice para busca instantânea de tokens ativos não-admin
CREATE INDEX IF NOT EXISTS idx_device_tokens_active_non_admin 
    ON public.device_tokens(invalidated_at, is_admin_device);

-- Backfill: Marca como admin_device tokens associados a e-mails administrativos conhecidos
DO $$
BEGIN
    UPDATE public.device_tokens
    SET is_admin_device = TRUE
    WHERE user_id IN (
        SELECT id FROM auth.users 
        WHERE email IN ('wn7corporation@gmail.com', 'suporte@direitoprime.com.br')
    );
EXCEPTION WHEN OTHERS THEN
    -- Silencioso caso auth.users não seja diretamente acessível nesta role
    NULL;
END $$;

-- 2. Tabela oficial user_notifications (Inbox real do usuário no aplicativo)
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'geral', -- 'leis', 'noticias', 'estudos', 'lembretes', 'sistema', 'blog'
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    clicked BOOLEAN NOT NULL DEFAULT FALSE,
    clicked_at TIMESTAMPTZ,
    campaign_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de alta performance para a inbox
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created 
    ON public.user_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread 
    ON public.user_notifications(user_id, read) WHERE read = FALSE;

-- Grants
GRANT ALL ON public.user_notifications TO anon, authenticated, service_role;

-- RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário acessa suas próprias notificações" ON public.user_notifications;
CREATE POLICY "Usuário acessa suas próprias notificações" ON public.user_notifications
    FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 3. Tabela oficial user_push_preferences (Preferências de categorias e horários de silêncio)
CREATE TABLE IF NOT EXISTS public.user_push_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    opt_in_leis BOOLEAN NOT NULL DEFAULT TRUE,
    opt_in_noticias BOOLEAN NOT NULL DEFAULT TRUE,
    opt_in_estudos BOOLEAN NOT NULL DEFAULT TRUE,
    opt_in_promocoes BOOLEAN NOT NULL DEFAULT TRUE,
    opt_in_lembretes BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '07:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_user_push_prefs_user 
    ON public.user_push_preferences(user_id);

-- Grants
GRANT ALL ON public.user_push_preferences TO anon, authenticated, service_role;

-- RLS
ALTER TABLE public.user_push_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia suas preferências de push" ON public.user_push_preferences;
CREATE POLICY "Usuário gerencia suas preferências de push" ON public.user_push_preferences
    FOR ALL
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 4. Função RPC de verificação de admin oficial e atualizada
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = _user_id 
        AND (
            email IN ('wn7corporation@gmail.com', 'suporte@direitoprime.com.br')
            OR raw_user_meta_data->>'role' = 'admin'
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 5. RPC para marcar token como dispositivo de admin
CREATE OR REPLACE FUNCTION public.set_device_token_admin(p_token TEXT, p_is_admin BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.device_tokens
    SET is_admin_device = p_is_admin,
        updated_at = now()
    WHERE token = p_token;
END;
$$;

