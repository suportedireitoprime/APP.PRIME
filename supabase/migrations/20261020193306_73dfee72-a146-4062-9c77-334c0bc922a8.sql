-- 1) Restaura assinantes que pagaram e foram cortados por engano (busca por e-mail)
with afetados as (
  select l.id lid, u.id uid, s.started_at,
         greatest(s.started_at, now()) + interval '34 days' novo_exp
  from legacy_subscribers l
  join auth.users u on lower(u.email) = lower(l.email)
  join asaas_subscriptions s on s.user_id = u.id
  where s.status = 'CANCELED'
    and l.observacao ilike '%corte automatico%'
    and s.started_at > now() - interval '40 days'
), upd_leg as (
  update legacy_subscribers l
     set status = 'active', expires_at = a.started_at + interval '34 days',
         claimed_user_id = coalesce(l.claimed_user_id, a.uid),
         observacao = coalesce(l.observacao,'') || ' | restaurado (pagamento recente cortado por engano) em ' || now()::date
    from afetados a where l.id = a.lid returning 1
), upd_sub as (
  update asaas_subscriptions s
     set status = 'ACTIVE', expires_at = a.started_at + interval '34 days', updated_at = now()
    from afetados a where s.user_id = a.uid returning 1
)
update profiles p set is_premium = true from afetados a where p.id = a.uid;

-- 2) Corte automático: nunca cortar quem pagou dentro do ciclo; casa também por e-mail
create or replace function public.cortar_inadimplentes_asaas()
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare n integer;
begin
  with cortados as (
    update legacy_subscribers l
       set status='inactive',
           observacao = coalesce(l.observacao,'') || ' | corte automatico inadimplencia >3d em ' || now()::date
     where l.status='active' and l.tipo <> 'vitalicio' and l.expires_at is not null and l.expires_at < now()
       and not exists (
         select 1 from asaas_subscriptions s
         left join auth.users u on u.id = s.user_id
         where (s.user_id = l.claimed_user_id or lower(u.email) = lower(l.email))
           and s.status in ('ACTIVE','ACTIVE_GRACE')
           and s.started_at > now() - case when l.tipo in ('anual','anual_promocional') then interval '370 days'
                                            when l.tipo = 'semestral' then interval '190 days'
                                            else interval '34 days' end
       )
    returning claimed_user_id
  )
  select count(*) into n from cortados;

  update asaas_subscriptions s
     set status='CANCELED', expires_at=now(), updated_at=now()
    from legacy_subscribers l
   where l.claimed_user_id = s.user_id and l.status='inactive' and s.status='ACTIVE'
     and s.started_at < now() - interval '34 days';
  return n;
end $function$;