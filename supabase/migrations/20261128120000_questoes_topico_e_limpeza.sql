-- Migração: adiciona coluna topico/tema_amplo, atualiza RPCs de filtro e limpa questões/simulados antigos

ALTER TABLE public.questoes
  ADD COLUMN IF NOT EXISTS topico text,
  ADD COLUMN IF NOT EXISTS tema_amplo text;

CREATE INDEX IF NOT EXISTS idx_questoes_topico ON public.questoes (topico) WHERE topico IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questoes_tema_amplo ON public.questoes (tema_amplo) WHERE tema_amplo IS NOT NULL;

ALTER TABLE public.simulado_questions
  ADD COLUMN IF NOT EXISTS topico text,
  ADD COLUMN IF NOT EXISTS tema_amplo text;

CREATE OR REPLACE FUNCTION public.questoes_segmento(_cargo text, _nivel text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case
    when coalesce(_nivel,'') in ('iniciante', 'conceitual') or coalesce(_cargo,'') ~* '(analista|escrevente|agente administrativo|conceitual|doutrina)' then 'conceituais'
    when coalesce(_nivel,'') = 'oab' or coalesce(_cargo,'') ~* '(oab|exame de ordem)' then 'oab'
    when coalesce(_cargo,'') ~* '(pol[ií]c|delegad|escriv|papilosc|perit|investigador|rodovi[áa]ri|bombeir|militar)' then 'policiais'
    else 'concursos'
  end
$function$;

DROP FUNCTION IF EXISTS public.questoes_filtrar(text[], text[], text[], integer[], text[], text, text, integer);
CREATE OR REPLACE FUNCTION public.questoes_filtrar(
  _segmentos text[] DEFAULT NULL::text[],
  _disciplinas text[] DEFAULT NULL::text[],
  _assuntos text[] DEFAULT NULL::text[],
  _anos integer[] DEFAULT NULL::integer[],
  _bancas text[] DEFAULT NULL::text[],
  _status text DEFAULT 'todos'::text,
  _ordem text DEFAULT 'embaralhado'::text,
  _limit integer DEFAULT 100000,
  _topicos text[] DEFAULT NULL::text[]
)
 RETURNS SETOF questoes
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select q.*
  from public.questoes q
  left join public.questoes_respostas r
    on r.questao_id = q.id and r.user_id = auth.uid()
  where q.ativo is true
    and (_segmentos is null or array_length(_segmentos,1) is null or public.questoes_segmento(q.cargo, q.nivel) = any(_segmentos))
    and (_disciplinas is null or array_length(_disciplinas,1) is null or q.disciplina = any(_disciplinas))
    and (_assuntos is null or array_length(_assuntos,1) is null or q.assunto = any(_assuntos))
    and (_topicos is null or array_length(_topicos,1) is null or q.topico = any(_topicos))
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
$function$;

DROP FUNCTION IF EXISTS public.questoes_filtro_counts(text[], text[], text[], integer[], text[]);
CREATE OR REPLACE FUNCTION public.questoes_filtro_counts(
  _segmentos text[] DEFAULT NULL::text[],
  _disciplinas text[] DEFAULT NULL::text[],
  _assuntos text[] DEFAULT NULL::text[],
  _anos integer[] DEFAULT NULL::integer[],
  _bancas text[] DEFAULT NULL::text[],
  _topicos text[] DEFAULT NULL::text[]
)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
por_top as (
  select * from por_ass
  where _topicos is null or array_length(_topicos,1) is null or topico = any(_topicos)
),
por_ano as (
  select * from por_top
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
  'topicos', coalesce((select jsonb_object_agg(topico, n) from (select topico, count(*) n from por_ass where topico is not null group by topico) s), '{}'::jsonb),
  'anos', coalesce((select jsonb_object_agg(ano::text, n) from (select ano, count(*) n from por_top where ano is not null group by ano) s), '{}'::jsonb),
  'bancas', coalesce((select jsonb_object_agg(banca, n) from (select banca, count(*) n from por_ano where banca is not null group by banca) s), '{}'::jsonb),
  'total', (select count(*) from final)
)
$function$;

-- Limpeza completa das questões e simulados antigos
TRUNCATE TABLE
  public.questoes_respostas,
  public.questoes_acoes_cache,
  public.questoes_favoritos,
  public.erros_questoes,
  public.questoes,
  public.simulado_questions,
  public.simulados,
  public.simulado_exams,
  public.questoes_planilhas
RESTART IDENTITY CASCADE;
