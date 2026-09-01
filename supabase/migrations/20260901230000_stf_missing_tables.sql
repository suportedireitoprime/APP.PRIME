-- Missing STF Tables for STF Dashboard

create table if not exists public.stf_informativos (
    id uuid default gen_random_uuid() primary key,
    numero text not null,
    titulo text not null,
    data_publicacao date,
    link_pdf text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.stf_informativos enable row level security;
create policy "STF informativos are viewable by everyone" on public.stf_informativos for select using (true);

create table if not exists public.stf_sumulas (
    id uuid default gen_random_uuid() primary key,
    numero text not null,
    texto text not null,
    tipo text default 'vinculante',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.stf_sumulas enable row level security;
create policy "STF sumulas are viewable by everyone" on public.stf_sumulas for select using (true);

create table if not exists public.stf_jurisprudencia (
    id uuid default gen_random_uuid() primary key,
    titulo text not null,
    ementa text,
    data_julgamento date,
    relator text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.stf_jurisprudencia enable row level security;
create policy "STF jurisprudencia is viewable by everyone" on public.stf_jurisprudencia for select using (true);
