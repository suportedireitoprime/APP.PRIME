-- Habilita Realtime nas tabelas do dashboard admin
-- Necessário para que o Supabase Realtime envie eventos postgres_changes

-- user_activity_log
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_activity_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_log;
  END IF;
END $$;

-- profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- app_events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_events;
  END IF;
END $$;

-- legacy_subscribers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'legacy_subscribers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.legacy_subscribers;
  END IF;
END $$;
