-- Remove cron quebrado (mv_ranking_semanal inexistente) e escalona horários para evitar job startup timeout
DO $$
DECLARE
  v_jobid bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-ranking-semanal') THEN
    PERFORM cron.unschedule('refresh-ranking-semanal');
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'blog-edicao-scheduler' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id => v_jobid, schedule => '4,34 * * * *');
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'raspar-noticias-gran-30m' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id => v_jobid, schedule => '11,41 * * * *');
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'push-dispatcher-tick' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id => v_jobid, schedule => '2,17,32,47 * * * *');
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'notificacao-personalizada' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id => v_jobid, schedule => '22 * * * *');
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'enviar-newsletter-diario' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id => v_jobid, schedule => '26 * * * *');
  END IF;

  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'sync-noticias-migalhas' LIMIT 1;
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.alter_job(job_id => v_jobid, schedule => '19 8,14,19 * * *');
  END IF;
END $$;
