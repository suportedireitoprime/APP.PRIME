create table if not exists public.laboratorio_cenas (
    id uuid default gen_random_uuid() primary key,
    codigo_nome text not null,
    artigo_numero integer not null,
    cena_json jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.laboratorio_cenas enable row level security;

-- Create policies
create policy "Cenas do laboratorio sao visiveis para todos os usuarios autenticados"
    on public.laboratorio_cenas
    for select
    to authenticated
    using (true);

-- Indexes for performance
create index if not exists idx_laboratorio_cenas_codigo_artigo on public.laboratorio_cenas (codigo_nome, artigo_numero);
