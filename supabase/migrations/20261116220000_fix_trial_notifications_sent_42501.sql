-- ==============================================================================
-- MIGRAÇÃO: Correção do Erro 42501 (Permission Denied) em trial_notifications_sent
-- Projeto: ESTUDOS JURIDICOS - APP (dnjrgpldcwcpoywamorr)
-- Causa: O cron job unificado (push-dispatcher-tick / cron 39) roda a cada 15 min
--        e consulta/grava na tabela trial_notifications_sent para deduplicar
--        lembretes de trial (6h restantes e expirado). A tabela estava sem GRANT
--        para as roles do Supabase e com RLS restrito apenas a admin.
-- ==============================================================================

-- 1. Cria a tabela caso ainda não exista
CREATE TABLE IF NOT EXISTS public.trial_notifications_sent (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'sent',
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT uq_trial_notif UNIQUE(user_id, notification_type)
);

-- 2. Concede privilégios de tabela para todas as roles do Supabase (elimina erro 42501)
GRANT ALL ON TABLE public.trial_notifications_sent TO service_role, postgres;
GRANT SELECT, INSERT, UPDATE ON TABLE public.trial_notifications_sent TO anon, authenticated;

-- 3. Habilita RLS
ALTER TABLE public.trial_notifications_sent ENABLE ROW LEVEL SECURITY;

-- 4. Política para o service_role / cron jobs das Edge Functions
DROP POLICY IF EXISTS service_role_trial_notifications ON public.trial_notifications_sent;
CREATE POLICY service_role_trial_notifications ON public.trial_notifications_sent 
  FOR ALL TO service_role 
  USING (true) 
  WITH CHECK (true);

-- 5. Política para leitura e inserção do sistema
DROP POLICY IF EXISTS admin_trial_notifications ON public.trial_notifications_sent;
DROP POLICY IF EXISTS all_trial_notifications ON public.trial_notifications_sent;
CREATE POLICY all_trial_notifications ON public.trial_notifications_sent 
  FOR ALL TO public 
  USING (true) 
  WITH CHECK (true);
