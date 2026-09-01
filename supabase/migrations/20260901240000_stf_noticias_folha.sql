create table if not exists public.stf_noticias_folha (
    id uuid default gen_random_uuid() primary key,
    titulo text not null,
    resumo text,
    url text unique not null,
    data_publicacao timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stf_noticias_folha enable row level security;

create policy "stf noticias are viewable by everyone" 
on public.stf_noticias_folha for select using (true);

-- Create cron job to run every 10 minutes
SELECT cron.schedule(
  'scrape-noticias-stf-folha-cron',
  '*/10 * * * *',
  $$
    SELECT net.http_post(
      url:='https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/scrape-noticias-stf-folha',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb
    );
  $$
);
