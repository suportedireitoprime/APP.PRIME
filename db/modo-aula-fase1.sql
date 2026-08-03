-- Modo Aula — Fase 1: base de dados (aplicada via psql em 2026-08-03)
-- disciplinas, aulas, aula_midias, aula_transcricoes, aula_marcadores, aula_entidades, aula_materiais
-- + bucket privado `modo-aula`

-- ── Disciplinas ────────────────────────────────────────────────
create table if not exists public.disciplinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  professor text,
  cor text default '#7B1E28',
  periodo text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.disciplinas to authenticated;
grant all on public.disciplinas to service_role;
alter table public.disciplinas enable row level security;
do $$ begin
  create policy "disciplinas_owner" on public.disciplinas
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
create index if not exists disciplinas_user_idx on public.disciplinas(user_id, created_at desc);

-- ── Aulas ──────────────────────────────────────────────────────
create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  disciplina_id uuid references public.disciplinas(id) on delete set null,
  titulo text not null,
  numero int,
  professor text,
  data date not null default current_date,
  -- rascunho | gravando | processando | transcrita | erro
  status text not null default 'rascunho',
  duracao_seg int not null default 0,
  gratuita boolean not null default false,
  erro text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.aulas to authenticated;
grant all on public.aulas to service_role;
alter table public.aulas enable row level security;
do $$ begin
  create policy "aulas_owner" on public.aulas
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
create index if not exists aulas_user_idx on public.aulas(user_id, created_at desc);
create index if not exists aulas_disciplina_idx on public.aulas(disciplina_id, data desc);

-- ── Mídias da aula ─────────────────────────────────────────────
create table if not exists public.aula_midias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  -- audio | foto_lousa | foto_slide | foto_caderno | anotacao
  tipo text not null,
  storage_path text,
  mime text,
  bytes bigint,
  duracao_seg int,
  ordem int not null default 0,
  ocr_texto text,
  texto text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.aula_midias to authenticated;
grant all on public.aula_midias to service_role;
alter table public.aula_midias enable row level security;
do $$ begin
  create policy "aula_midias_owner" on public.aula_midias
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
create index if not exists aula_midias_aula_idx on public.aula_midias(aula_id, ordem);

-- ── Transcrições ───────────────────────────────────────────────
create table if not exists public.aula_transcricoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  texto text not null default '',
  -- [{ ini: number, fim: number, fala: string, speaker?: string }]
  segmentos jsonb not null default '[]'::jsonb,
  idioma text default 'pt',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.aula_transcricoes to authenticated;
grant all on public.aula_transcricoes to service_role;
alter table public.aula_transcricoes enable row level security;
do $$ begin
  create policy "aula_transcricoes_owner" on public.aula_transcricoes
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
create unique index if not exists aula_transcricoes_aula_uidx on public.aula_transcricoes(aula_id);

-- ── Marcadores ─────────────────────────────────────────────────
create table if not exists public.aula_marcadores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  segundo int not null default 0,
  -- manual | prova | exemplo | pergunta | conceito
  tipo text not null default 'manual',
  texto text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.aula_marcadores to authenticated;
grant all on public.aula_marcadores to service_role;
alter table public.aula_marcadores enable row level security;
do $$ begin
  create policy "aula_marcadores_owner" on public.aula_marcadores
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
create index if not exists aula_marcadores_aula_idx on public.aula_marcadores(aula_id, segundo);

-- ── Entidades detectadas ───────────────────────────────────────
create table if not exists public.aula_entidades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  -- artigo | lei | livro | jurisprudencia | conceito
  tipo text not null,
  valor text not null,
  ref text,
  segundo int,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.aula_entidades to authenticated;
grant all on public.aula_entidades to service_role;
alter table public.aula_entidades enable row level security;
do $$ begin
  create policy "aula_entidades_owner" on public.aula_entidades
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
create index if not exists aula_entidades_aula_idx on public.aula_entidades(aula_id, tipo);

-- ── Materiais gerados ──────────────────────────────────────────
create table if not exists public.aula_materiais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id uuid not null references public.aulas(id) on delete cascade,
  -- resumo | resumo_1pagina | flashcards | questoes | simulado | mapa_mental | fichamento | checklist
  tipo text not null,
  conteudo jsonb not null default '{}'::jsonb,
  pdf_path text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.aula_materiais to authenticated;
grant all on public.aula_materiais to service_role;
alter table public.aula_materiais enable row level security;
do $$ begin
  create policy "aula_materiais_owner" on public.aula_materiais
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
create unique index if not exists aula_materiais_uidx on public.aula_materiais(aula_id, tipo);

-- ── Bucket privado ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('modo-aula', 'modo-aula', false)
on conflict (id) do nothing;

do $$ begin
  create policy "modo_aula_read_own" on storage.objects
    for select to authenticated
    using (bucket_id = 'modo-aula' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "modo_aula_insert_own" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'modo-aula' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "modo_aula_update_own" on storage.objects
    for update to authenticated
    using (bucket_id = 'modo-aula' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "modo_aula_delete_own" on storage.objects
    for delete to authenticated
    using (bucket_id = 'modo-aula' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
