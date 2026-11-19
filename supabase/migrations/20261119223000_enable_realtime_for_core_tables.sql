-- ==============================================================================
-- Migração: Habilita Realtime e REPLICA IDENTITY FULL para Tabelas Centrais
-- Data: 2026-11-19
-- Resolve:
--   1. CHANNEL_ERROR (726 erros) no Supabase Realtime
--   2. Esgotamento do pool de conexões (PostgREST e Auth Unhealthy)
--   3. Suporte a filtros reativos em profiles, user_notifications, asaas_subscriptions
-- ==============================================================================

-- 1. profiles: tabela mestre com PK id (escutada por useSubscription e CheckoutModal)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 2. user_notifications: inbox e badge do sininho (escutada por useUnreadNotifCount)
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;

-- 3. asaas_subscriptions: status de pagamento PIX/Cartão (escutada por CheckoutModal e useSubscription)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_subscriptions') THEN
    ALTER TABLE public.asaas_subscriptions REPLICA IDENTITY FULL;
  END IF;
END $$;

-- 4. reminder_dispatch_log: lembretes em tempo real (escutada por ReminderInAppBanner)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminder_dispatch_log') THEN
    ALTER TABLE public.reminder_dispatch_log REPLICA IDENTITY FULL;
  END IF;
END $$;

-- 5. biblioteca_leitura_nativa: sincronização de leitura (escutada por useBibliotecaLeituraStatus)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'biblioteca_leitura_nativa') THEN
    ALTER TABLE public.biblioteca_leitura_nativa REPLICA IDENTITY FULL;
  END IF;
END $$;

-- 6. Adiciona à publicação oficial supabase_realtime de forma segura e idempotente
DO $$
BEGIN
  -- profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  -- user_notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
  END IF;

  -- asaas_subscriptions (se existir)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'asaas_subscriptions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'asaas_subscriptions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.asaas_subscriptions;
    END IF;
  END IF;

  -- reminder_dispatch_log (se existir)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminder_dispatch_log') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'reminder_dispatch_log'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.reminder_dispatch_log;
    END IF;
  END IF;

  -- biblioteca_leitura_nativa (se existir)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'biblioteca_leitura_nativa') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'biblioteca_leitura_nativa'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.biblioteca_leitura_nativa;
    END IF;
  END IF;
END $$;
