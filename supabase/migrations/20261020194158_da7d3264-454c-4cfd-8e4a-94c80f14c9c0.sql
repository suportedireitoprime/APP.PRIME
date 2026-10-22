do $$
declare r record;
begin
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) a,
           p.prorettype = 'trigger'::regtype as trg
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and not exists (select 1 from pg_policies pol
                      where pol.qual ilike '%' || p.proname || '(%' or pol.with_check ilike '%' || p.proname || '(%')
  loop
    if r.trg or r.proname in ('cortar_inadimplentes_asaas','aplicar_hierarquia_lei','horus_transferir_numero','flashcards_recontar_areas') then
      -- uso apenas interno (gatilhos, cron, servidor)
      execute format('revoke execute on function public.%I(%s) from public, anon, authenticated', r.proname, r.a);
    elsif r.proname like 'admin\_%' or r.proname = 'criar_modulo_com_aulas_draft' then
      -- funções de administrador: nunca para visitantes sem login
      execute format('revoke execute on function public.%I(%s) from public, anon', r.proname, r.a);
      execute format('grant execute on function public.%I(%s) to authenticated', r.proname, r.a);
    end if;
    execute format('grant execute on function public.%I(%s) to service_role', r.proname, r.a);
  end loop;

  -- fixa o caminho de busca em funções que não o têm
  for r in
    select p.proname, pg_get_function_identity_arguments(p.oid) a
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  loop
    execute format('alter function public.%I(%s) set search_path = public', r.proname, r.a);
  end loop;
end $$;