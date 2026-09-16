-- Ensure the required extensions are available
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job to run at 10:30 AM BRT (13:30 UTC) every day
-- The function runs using pg_net to make an HTTP POST request to the Edge Function
SELECT cron.schedule(
  'invoke-sync-stf-sheets', -- Job name
  '30 13 * * *',            -- Every day at 10:30 AM BRT (13:30 UTC)
  $$
  SELECT net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/sync-stf-sheets',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  $$
);
