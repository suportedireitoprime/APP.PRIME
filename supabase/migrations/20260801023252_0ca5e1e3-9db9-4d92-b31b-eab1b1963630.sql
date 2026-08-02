select cron.schedule(
  'sync-noticias-migalhas',
  '10 */2 * * *',
  $$
  select net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/sync-noticias-migalhas',
    headers:='{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);