-- ==============================================================================
-- Migração: Remoção de Cron Jobs Legados de Importação / Carga
-- Data: 2026-11-13
-- Objetivo: Desagendar rotinas automáticas de importação legada no pg_cron
--           para poupar CPU, memória e invocações de Edge Functions.
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'cron' AND tablename = 'job') THEN
    FOR r IN (
      SELECT jobid, jobname FROM cron.job 
      WHERE jobname ILIKE '%importar%' 
         OR jobname ILIKE '%provas-oab%'
         OR jobname ILIKE '%import-flashcard%'
    ) LOOP
      RAISE NOTICE 'Desagendando cron legado: % (id %)', r.jobname, r.jobid;
      PERFORM cron.unschedule(r.jobid);
    END LOOP;
  END IF;
END $$;

