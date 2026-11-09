-- ==============================================================================
-- MIGRAÇÃO: Sincronização de Avatares e E-mails de Usuários (Google OAuth) em Profiles
-- Projeto: ESTUDOS JURIDICOS - APP (dnjrgpldcwcpoywamorr)
-- ==============================================================================

-- 1. Sincroniza dados existentes em profiles a partir de auth.users
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

-- 2. Insere perfis faltantes para usuários em auth.users
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

-- 3. Função de Trigger para manter profiles sempre sincronizado com auth.users em novos signups e updates
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

-- 4. Atualiza a RPC admin_user_auth_providers para também retornar avatar_url diretamente de auth.users
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
           -- Prioridade máxima: Google se houver identidade Google
           WHEN EXISTS (
             SELECT 1 FROM auth.identities i 
             WHERE i.user_id = u.id AND i.provider = 'google'
           ) THEN 'google'
           -- Se metadata indica Google OAuth
           WHEN u.raw_app_meta_data->'providers' @> '["google"]'::jsonb THEN 'google'
           WHEN u.raw_user_meta_data->>'iss' LIKE '%google%' THEN 'google'
           WHEN u.raw_user_meta_data->>'avatar_url' LIKE '%googleusercontent%' THEN 'google'
           WHEN u.raw_user_meta_data->>'picture' LIKE '%googleusercontent%' THEN 'google'
           -- Outros provedores
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

