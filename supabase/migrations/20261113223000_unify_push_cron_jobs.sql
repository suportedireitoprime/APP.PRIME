-- ==============================================================================
-- Migração: Consolidação e Unificação dos Cron Jobs de Notificações Push
-- Data: 2026-11-13
-- Objetivo: Desagendar múltiplos cron jobs repetitivos de 1 minuto 
--           (push-scheduler, reminders-tick, trial-reminders-tick) 
--           e consolidá-los em um despachante unificado (push-dispatcher)
--           executando a cada 15 minutos, aliviando o pool de conexões e CPU do Postgres.
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
  cmd TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'cron' AND tablename = 'job') THEN
    -- 1. Captura o padrão de comando HTTP/RPC dos crons de push/reminder existentes
    SELECT command INTO cmd FROM cron.job 
    WHERE (jobname ILIKE '%push%' OR jobname ILIKE '%reminder%') 
      AND command ILIKE '%http%' 
    LIMIT 1;

    -- 2. Desagenda crons redundantes de 1 minuto
    FOR r IN (
      SELECT jobid, jobname FROM cron.job 
      WHERE jobname ILIKE '%push-scheduler%' 
         OR jobname ILIKE '%reminders-tick%'
         OR jobname ILIKE '%trial-reminders%'
         OR jobname ILIKE '%push_scheduler%'
         OR jobname ILIKE '%push-dispatcher%'
    ) LOOP
      RAISE NOTICE 'Desagendando cron redundante: % (id %)', r.jobname, r.jobid;
      PERFORM cron.unschedule(r.jobid);
    END LOOP;

    -- 3. Agenda o despachante unificado push-dispatcher a cada 15 minutos
    IF cmd IS NOT NULL AND length(cmd) > 0 THEN
      cmd := regexp_replace(cmd, '(push-scheduler|reminders-tick|trial-reminders-tick)', 'push-dispatcher', 'g');
    ELSE
      cmd := $cmd$SELECT net.http_post(url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/push-dispatcher', headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0'), body:='{"action":"all"}'::jsonb);$cmd$;
    END IF;
    PERFORM cron.schedule('push-dispatcher-tick', '*/15 * * * *', cmd);
    RAISE NOTICE 'Agendado novo cron unificado push-dispatcher-tick a cada 15 minutos';
  END IF;
END $$;
