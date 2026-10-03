DO $$
BEGIN
  PERFORM cron.unschedule('article-reminders-tick-1min');
EXCEPTION
  WHEN OTHERS THEN
    -- ignore error
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('reminders-tick-1min');
EXCEPTION
  WHEN OTHERS THEN
    -- ignore error
END $$;

SELECT cron.schedule(
  'reminders-tick-1min',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/reminders-tick',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
