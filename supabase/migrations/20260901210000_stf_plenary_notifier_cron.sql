-- Schedule daily cron job for STF Plenary Notifier at 08:00 AM
SELECT cron.schedule(
  'stf-plenary-daily-push',
  '0 8 * * *',
  $$
    SELECT net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/stf-plenary-notifier',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:='{}'::jsonb
    );
  $$
);
