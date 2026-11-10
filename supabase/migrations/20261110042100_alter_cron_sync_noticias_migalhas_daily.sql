-- Atualiza agendamento do cron job sync-noticias-migalhas (id 54)
-- Executa diariamente às 08:00, 14:00 e 19:00 UTC (incluindo fins de semana)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-noticias-migalhas') THEN
    PERFORM cron.alter_job(
      job_id := (SELECT jobid FROM cron.job WHERE jobname = 'sync-noticias-migalhas' LIMIT 1),
      schedule := '0 8,14,19 * * *'
    );
  END IF;
END $$;

