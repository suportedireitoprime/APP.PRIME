-- Criação da tabela para armazenar episódios do podcast da Rádio e TV Justiça
create table if not exists public.tv_justica_podcasts (
    id uuid primary key default gen_random_uuid(),
    youtube_video_id text not null unique,
    title text not null,
    description text,
    thumbnail_url text,
    published_at timestamp with time zone not null,
    duration text, -- Opcional, o YouTube data API não envia no playlistItems
    created_at timestamp with time zone default now()
);

-- Habilitar RLS (Row Level Security)
alter table public.tv_justica_podcasts enable row level security;

-- Permitir acesso de leitura público (aplicativo)
create policy "Podcasts são visíveis para todos os usuários"
    on public.tv_justica_podcasts for select
    using (true);

-- Apenas a service_role (Edge Function) pode inserir/atualizar
create policy "Apenas Edge Function pode modificar podcasts"
    on public.tv_justica_podcasts for all
    using (auth.jwt() ->> 'role' = 'service_role');
