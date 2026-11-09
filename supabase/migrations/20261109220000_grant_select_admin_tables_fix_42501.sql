-- ==============================================================================
-- MIGRAÇÃO: Correção de Erros 42501 (Permission Denied) no Supabase Postgres
-- Concede permissão de SELECT para anon e authenticated com proteção total por RLS
-- ==============================================================================

-- 1. Grant SELECT nas tabelas de métricas e sessões para anon e authenticated
GRANT SELECT ON public.app_events TO anon, authenticated;
GRANT SELECT ON public.user_sessions TO anon, authenticated;
GRANT SELECT ON public.asaas_subscriptions TO anon, authenticated;
GRANT SELECT ON public.play_subscriptions TO anon, authenticated;
GRANT SELECT ON public.apple_subscriptions TO anon, authenticated;
GRANT SELECT ON public.legacy_subscribers TO anon, authenticated;
GRANT SELECT ON public.user_activity_log TO anon, authenticated;

-- 2. Garantir que RLS está habilitado em todas elas
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apple_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Admin para Apple e Legacy Subscriptions (outras já possuem)
DROP POLICY IF EXISTS admin_select_apple_subs ON public.apple_subscriptions;
CREATE POLICY admin_select_apple_subs ON public.apple_subscriptions 
  FOR SELECT TO authenticated 
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS admin_select_legacy_subs ON public.legacy_subscribers;
CREATE POLICY admin_select_legacy_subs ON public.legacy_subscribers 
  FOR SELECT TO authenticated 
  USING (public.is_admin_user(auth.uid()));

