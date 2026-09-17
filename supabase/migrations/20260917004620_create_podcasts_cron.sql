-- Setup cron job for syncing TV Justiça Podcasts via Edge Function

select cron.schedule(
  'invoke-sync-podcasts',
  '30 14 * * *', -- Roda todos os dias às 14:30 UTC (11:30 BRT)
  $$
    select net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/sync-podcasts',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);
