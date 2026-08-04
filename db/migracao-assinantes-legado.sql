-- ============================================================
-- Migração de assinantes do app antigo (Supabase antigo + Asaas)
-- ============================================================

-- 1) Lista de assinantes importados do app antigo -------------
create table if not exists public.legacy_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nome text,
  -- 'vitalicio' = acesso permanente | 'mensal' = renova via Asaas
  tipo text not null default 'mensal' check (tipo in ('vitalicio', 'mensal')),
  asaas_customer_id text,
  asaas_subscription_id text,
  -- validade atual (null = sem expiração / vitalício)
  expires_at timestamptz,
  status text not null default 'active',
  observacao text,
  claimed_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists legacy_subscribers_email_key
  on public.legacy_subscribers (lower(email));
create index if not exists legacy_subscribers_asaas_customer_idx
  on public.legacy_subscribers (asaas_customer_id);

grant select on public.legacy_subscribers to authenticated;
grant all on public.legacy_subscribers to service_role;
alter table public.legacy_subscribers enable row level security;

drop policy if exists "legacy_subscribers_own_email" on public.legacy_subscribers;
create policy "legacy_subscribers_own_email"
  on public.legacy_subscribers for select to authenticated
  using (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));

-- 2) Assinaturas ativas via Asaas (nova fonte de premium) -----
create table if not exists public.asaas_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plano text not null default 'mensal',
  status text not null default 'ACTIVE',
  asaas_customer_id text,
  asaas_subscription_id text,
  started_at timestamptz not null default now(),
  -- null = vitalício
  expires_at timestamptz,
  origem text not null default 'legado',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists asaas_subscriptions_user_key
  on public.asaas_subscriptions (user_id);
create index if not exists asaas_subscriptions_asaas_sub_idx
  on public.asaas_subscriptions (asaas_subscription_id);

grant select on public.asaas_subscriptions to authenticated;
grant all on public.asaas_subscriptions to service_role;
alter table public.asaas_subscriptions enable row level security;

drop policy if exists "asaas_subscriptions_select_own" on public.asaas_subscriptions;
create policy "asaas_subscriptions_select_own"
  on public.asaas_subscriptions for select to authenticated
  using (auth.uid() = user_id);

-- 3) Ativação automática ao entrar pela primeira vez ----------
create or replace function public.claim_legacy_subscription(_user_id uuid, _email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.legacy_subscribers;
begin
  if _email is null or _user_id is null then return false; end if;

  select * into rec from public.legacy_subscribers
   where lower(email) = lower(_email)
     and status = 'active'
   limit 1;

  if rec.id is null then return false; end if;

  insert into public.asaas_subscriptions
    (user_id, plano, status, asaas_customer_id, asaas_subscription_id, expires_at, origem)
  values (
    _user_id,
    case when rec.tipo = 'vitalicio' then 'vitalicio' else 'mensal' end,
    'ACTIVE',
    rec.asaas_customer_id,
    rec.asaas_subscription_id,
    case when rec.tipo = 'vitalicio' then null else rec.expires_at end,
    'legado'
  )
  on conflict (user_id) do update
    set plano = excluded.plano,
        status = 'ACTIVE',
        asaas_customer_id = coalesce(excluded.asaas_customer_id, public.asaas_subscriptions.asaas_customer_id),
        asaas_subscription_id = coalesce(excluded.asaas_subscription_id, public.asaas_subscriptions.asaas_subscription_id),
        expires_at = excluded.expires_at,
        updated_at = now();

  update public.legacy_subscribers
     set claimed_user_id = _user_id, claimed_at = now()
   where id = rec.id;

  return true;
end;
$$;

revoke all on function public.claim_legacy_subscription(uuid, text) from public;
grant execute on function public.claim_legacy_subscription(uuid, text) to service_role;

-- RPC segura para o app chamar no login (usa o próprio JWT)
create or replace function public.claim_my_legacy_subscription()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then return false; end if;
  return public.claim_legacy_subscription(auth.uid(), (auth.jwt() ->> 'email'));
end;
$$;

grant execute on function public.claim_my_legacy_subscription() to authenticated;

-- Trigger: novos usuários (inclusive os importados) já entram com o plano
create or replace function public.handle_legacy_subscriber_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.claim_legacy_subscription(new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_legacy_sub on auth.users;
create trigger on_auth_user_created_legacy_sub
  after insert on auth.users
  for each row execute function public.handle_legacy_subscriber_signup();
