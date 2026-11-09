-- ==============================================================================
-- MIGRAÇÃO DEFINITIVA: Resolução de Erros 42501 Postgres, Storage e Avatares
-- Projeto: ESTUDOS JURIDICOS - APP (dnjrgpldcwcpoywamorr)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEGURANÇA E CONCESSÃO DE PRIVILÉGIOS (ZERA ERROS 42501 NO POSTGRES)
-- ------------------------------------------------------------------------------

-- Garante que o schema public seja acessível por anon e authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Garante acesso a sequências para inserts
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Concede SELECT em todas as tabelas públicas para anon e authenticated.
-- O acesso real às linhas é estritamente controlado pelo Row Level Security (RLS).
-- Isso impede que Postgres dispare ERROR 42501 quando o app consulta tabelas
-- durante a inicialização/restauração de sessão de usuários ou visitantes anônimos.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Concede escrita completa para usuários autenticados (regrada por RLS)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Tabelas onde usuários anônimos / visitantes podem gravar dados públicos/telemetria
GRANT INSERT ON public.search_hits TO anon;
GRANT INSERT ON public.app_events TO anon;
GRANT INSERT ON public.app_feedback TO anon;
GRANT INSERT ON public.chat_feedback TO anon;
GRANT INSERT ON public.questoes_respostas TO anon;

-- Configura privilégios padrão para quaisquer tabelas e sequências futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- Garante RLS em trial_notifications_sent (única que faltava)
ALTER TABLE public.trial_notifications_sent ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_trial_notifications ON public.trial_notifications_sent;
CREATE POLICY admin_trial_notifications ON public.trial_notifications_sent 
  FOR ALL TO authenticated 
  USING (public.is_admin_user(auth.uid()));

-- ------------------------------------------------------------------------------
-- 2. CRIAÇÃO DO BUCKET feedback-photos E POLÍTICAS DE STORAGE (ZERA WARNINGS)
-- ------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-photos',
  'feedback-photos',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public view feedback photos" ON storage.objects;
CREATE POLICY "Public view feedback photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'feedback-photos');

DROP POLICY IF EXISTS "Anyone can upload feedback photos" ON storage.objects;
CREATE POLICY "Anyone can upload feedback photos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'feedback-photos');

-- ------------------------------------------------------------------------------
-- 3. SINCRONIZAÇÃO DE AVATARES E PERFIS (GOOGLE OAUTH)
-- ------------------------------------------------------------------------------

-- Atualiza perfis existentes sincronizando foto e display_name do Google
UPDATE public.profiles p
SET 
  avatar_url = COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
  email = COALESCE(p.email, u.email),
  display_name = COALESCE(p.display_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND (
    (p.avatar_url IS NULL AND (u.raw_user_meta_data->>'avatar_url' IS NOT NULL OR u.raw_user_meta_data->>'picture' IS NOT NULL))
    OR (p.email IS NULL AND u.email IS NOT NULL)
  );

-- Cria perfis para usuários em auth.users que ainda não possuam perfil
INSERT INTO public.profiles (id, email, display_name, avatar_url, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Usuário'),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
  email = COALESCE(public.profiles.email, EXCLUDED.email),
  display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
  updated_at = NOW();

-- Trigger para sincronização contínua em novos cadastros ou updates no auth.users
CREATE OR REPLACE FUNCTION public.handle_sync_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_sync_profile ON auth.users;
CREATE TRIGGER on_auth_user_sync_profile
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_sync_user_profile();

-- Atualiza a RPC admin_user_auth_providers para retornar avatar_url diretamente
DROP FUNCTION IF EXISTS public.admin_user_auth_providers(uuid[]);

CREATE OR REPLACE FUNCTION public.admin_user_auth_providers(_ids uuid[])
RETURNS TABLE(user_id uuid, email text, provider text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT u.id AS user_id,
         u.email::text,
         CASE
           WHEN EXISTS (
             SELECT 1 FROM auth.identities i 
             WHERE i.user_id = u.id AND i.provider = 'google'
           ) THEN 'google'
           WHEN u.raw_app_meta_data->'providers' @> '["google"]'::jsonb THEN 'google'
           WHEN u.raw_user_meta_data->>'iss' LIKE '%google%' THEN 'google'
           WHEN u.raw_user_meta_data->>'avatar_url' LIKE '%googleusercontent%' THEN 'google'
           WHEN u.raw_user_meta_data->>'picture' LIKE '%googleusercontent%' THEN 'google'
           ELSE COALESCE(
             (SELECT i.provider FROM auth.identities i
               WHERE i.user_id = u.id AND i.provider <> 'email'
               ORDER BY i.created_at LIMIT 1),
             (u.raw_app_meta_data->>'provider'),
             'email'
           )
         END::text AS provider,
         COALESCE(
           u.raw_user_meta_data->>'avatar_url',
           u.raw_user_meta_data->>'picture',
           (SELECT p.avatar_url FROM public.profiles p WHERE p.id = u.id)
         )::text AS avatar_url
  FROM auth.users u
  WHERE u.id = ANY(_ids);
$$;
