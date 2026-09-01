-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the Edge Function to run daily at 2:00 AM UTC
SELECT cron.schedule(
    'stf-scraper-daily',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/stf-scraper',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:='{}'::jsonb
    );
    $$
);
