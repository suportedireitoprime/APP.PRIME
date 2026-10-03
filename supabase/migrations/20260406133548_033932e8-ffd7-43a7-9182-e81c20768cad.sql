SELECT cron.schedule(
  'popular-texto-resenha-3h',
  '30 7,10,13,16,19,22 * * *',
  $$
  SELECT net.http_post(
    url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/popular-texto-resenha',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0"}'::jsonb,
    body:='{"limit":20}'::jsonb
  ) AS request_id;
  $$
);