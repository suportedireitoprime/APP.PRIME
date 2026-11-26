-- Remove crons pausados obsoletos e cria índices para eliminar seq_scan em tabelas quentes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scrape-concursos-job') THEN
    PERFORM cron.unschedule('scrape-concursos-job');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scrape-noticias-stf-folha-cron') THEN
    PERFORM cron.unschedule('scrape-noticias-stf-folha-cron');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-stf-streams-hourly') THEN
    PERFORM cron.unschedule('sync-stf-streams-hourly');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_legacy_subscribers_lower_email
  ON public.legacy_subscribers (lower(email));

CREATE INDEX IF NOT EXISTS idx_legacy_subscribers_claimed_user_id
  ON public.legacy_subscribers (claimed_user_id);

CREATE INDEX IF NOT EXISTS idx_asaas_subscriptions_user_status
  ON public.asaas_subscriptions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_resenha_diaria_data_publicacao
  ON public.resenha_diaria (data_publicacao DESC);
