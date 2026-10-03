-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove old job if exists
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'scrape-resenha-diaria-3h';

-- Create new cron job: every 3 hours starting 7 UTC (4h Brasília)
SELECT cron.schedule(
  'scrape-resenha-diaria-3h',
  '0 7,10,13,16,19,22 * * *',
  $$
  SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/scrape-resenha-diaria',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);