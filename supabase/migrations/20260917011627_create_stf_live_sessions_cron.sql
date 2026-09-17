-- Enable pg_net for HTTP requests if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set up the cron job to sync STF live streams every hour
SELECT cron.schedule(
  'sync-stf-streams-hourly', 
  '0 * * * *', 
  $$
  SELECT net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/sync-stf-streams',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
  ) as request_id;
  $$
);
