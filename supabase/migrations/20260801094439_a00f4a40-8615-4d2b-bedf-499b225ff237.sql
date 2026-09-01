create or replace function public.questoes_segmento(_cargo text, _nivel text)
returns text language sql immutable set search_path = public as $$
  select case
    when coalesce(_nivel,'') = 'iniciante' then 'conceituais'
    when coalesce(_cargo,'') ~* '(oab|exame de ordem)' then 'oab'
    when coalesce(_cargo,'') ~* '(pol[ií]c|delegad|escriv|papilosc|perit|investigador|rodovi[áa]ri|bombeir|militar)' then 'policiais'
    else 'concursos'
  end
$$;

create or replace function public.questoes_filtro_counts(
  _segmentos text[] default null,
  _disciplinas text[] default null,
  _assuntos text[] default null,
  _anos int[] default null,
  _bancas text[] default null
) returns jsonb language sql stable set search_path = public as $$
with base as (
  select q.*, public.questoes_segmento(q.cargo, q.nivel) as seg
  from public.questoes q
  where q.ativo is true
),
por_seg as (
  select * from base
  where _segmentos is null or array_length(_segmentos,1) is null or seg = any(_segmentos)
),
por_disc as (
  select * from por_seg
  where _disciplinas is null or array_length(_disciplinas,1) is null or disciplina = any(_disciplinas)
),
por_ass as (
  select * from por_disc
  where _assuntos is null or array_length(_assuntos,1) is null or assunto = any(_assuntos)
),
por_ano as (
  select * from por_ass
  where _anos is null or array_length(_anos,1) is null or ano = any(_anos)
),
final as (
  select * from por_ano
  where _bancas is null or array_length(_bancas,1) is null or banca = any(_bancas)
)
select jsonb_build_object(
  'segmentos', coalesce((select jsonb_object_agg(seg, n) from (select seg, count(*) n from base group by seg) s), '{}'::jsonb),
  'disciplinas', coalesce((select jsonb_object_agg(disciplina, n) from (select disciplina, count(*) n from por_seg where disciplina is not null group by disciplina) s), '{}'::jsonb),
  'assuntos', coalesce((select jsonb_object_agg(assunto, n) from (select assunto, count(*) n from por_disc where assunto is not null group by assunto) s), '{}'::jsonb),
  'anos', coalesce((select jsonb_object_agg(ano::text, n) from (select ano, count(*) n from por_ass where ano is not null group by ano) s), '{}'::jsonb),
  'bancas', coalesce((select jsonb_object_agg(banca, n) from (select banca, count(*) n from por_ano where banca is not null group by banca) s), '{}'::jsonb),
  'total', (select count(*) from final)
)
$$;

create or replace function public.questoes_filtrar(
  _segmentos text[] default null,
  _disciplinas text[] default null,
  _assuntos text[] default null,
  _anos int[] default null,
  _bancas text[] default null,
  _status text default 'todos',
  _ordem text default 'embaralhado',
  _limit int default 100000
) returns setof public.questoes language sql stable set search_path = public as $$
  select q.*
  from public.questoes q
  left join public.questoes_respostas r
    on r.questao_id = q.id and r.user_id = (select auth.uid())
  where q.ativo is true
    and (_segmentos is null or array_length(_segmentos,1) is null or public.questoes_segmento(q.cargo, q.nivel) = any(_segmentos))
    and (_disciplinas is null or array_length(_disciplinas,1) is null or q.disciplina = any(_disciplinas))
    and (_assuntos is null or array_length(_assuntos,1) is null or q.assunto = any(_assuntos))
    and (_anos is null or array_length(_anos,1) is null or q.ano = any(_anos))
    and (_bancas is null or array_length(_bancas,1) is null or q.banca = any(_bancas))
  group by q.id
  having case coalesce(_status,'todos')
    when 'resolvidas' then count(r.id) > 0
    when 'nao_resolvidas' then count(r.id) = 0
    when 'acertei' then count(r.id) filter (where r.acertou) > 0
    when 'errei' then count(r.id) filter (where not r.acertou) > 0
    else true
  end
  order by case when coalesce(_ordem,'embaralhado') = 'embaralhado' then random() else 0 end,
           q.ano desc nulls last, q.created_at
  limit greatest(coalesce(_limit, 100000), 1)
$$;

grant execute on function public.questoes_segmento(text, text) to anon, authenticated, service_role;
grant execute on function public.questoes_filtro_counts(text[], text[], text[], int[], text[]) to anon, authenticated, service_role;
grant execute on function public.questoes_filtrar(text[], text[], text[], int[], text[], text, text, int) to anon, authenticated, service_role;