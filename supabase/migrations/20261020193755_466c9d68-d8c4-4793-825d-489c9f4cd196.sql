create or replace function public.asaas_corrigir_vencimento_pagamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare ciclo interval; novo timestamptz; mail text;
begin
  -- só age quando um pagamento é registrado (started_at novo + ACTIVE)
  if new.status <> 'ACTIVE' or new.started_at is null then return new; end if;
  if tg_op = 'UPDATE' and new.started_at is not distinct from old.started_at then return new; end if;

  ciclo := case when new.plano in ('anual','anual_promocional') then interval '370 days'
                when new.plano = 'semestral' then interval '190 days'
                else interval '34 days' end;
  novo := new.started_at + ciclo;

  if new.plano <> 'vitalicio' and (new.expires_at is null or new.expires_at < novo) then
    new.expires_at := novo;
  end if;

  select email into mail from auth.users where id = new.user_id;
  update legacy_subscribers l
     set status = 'active',
         expires_at = greatest(coalesce(l.expires_at, novo), novo)
   where l.tipo <> 'vitalicio'
     and (l.claimed_user_id = new.user_id or (mail is not null and lower(l.email) = lower(mail)));

  update profiles set is_premium = true where id = new.user_id;
  return new;
end $$;

revoke execute on function public.asaas_corrigir_vencimento_pagamento() from public, anon, authenticated;

drop trigger if exists trg_asaas_corrigir_vencimento on public.asaas_subscriptions;
create trigger trg_asaas_corrigir_vencimento
before insert or update on public.asaas_subscriptions
for each row execute function public.asaas_corrigir_vencimento_pagamento();