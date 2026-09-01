
CREATE TABLE public.lei_seca_trilhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  sigla text,
  lei_slug text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  cor text DEFAULT 'from-violet-600 to-indigo-700',
  icone text DEFAULT 'Scale',
  partes jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_gerar boolean NOT NULL DEFAULT false,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lei_seca_trilhas TO anon, authenticated;
GRANT ALL ON public.lei_seca_trilhas TO service_role;
ALTER TABLE public.lei_seca_trilhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lei_seca_trilhas_select" ON public.lei_seca_trilhas FOR SELECT USING (true);

CREATE TABLE public.lei_seca_licoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_slug text NOT NULL REFERENCES public.lei_seca_trilhas(slug) ON DELETE CASCADE,
  parte text NOT NULL,
  titulo_pai text,
  titulo text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  artigos jsonb NOT NULL DEFAULT '[]'::jsonb,
  recorte text,
  exercicios jsonb,
  gerado_em timestamptz,
  versao_prompt text DEFAULT 'v1',
  status text NOT NULL DEFAULT 'pendente',
  erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trilha_slug, parte, ordem)
);
GRANT SELECT ON public.lei_seca_licoes TO anon, authenticated;
GRANT ALL ON public.lei_seca_licoes TO service_role;
ALTER TABLE public.lei_seca_licoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lei_seca_licoes_select" ON public.lei_seca_licoes FOR SELECT USING (true);
CREATE INDEX lei_seca_licoes_trilha_parte_idx ON public.lei_seca_licoes (trilha_slug, parte, ordem);

CREATE TABLE public.lei_seca_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  licao_id uuid NOT NULL REFERENCES public.lei_seca_licoes(id) ON DELETE CASCADE,
  estrelas int NOT NULL DEFAULT 0,
  vidas_restantes int NOT NULL DEFAULT 3,
  concluida boolean NOT NULL DEFAULT false,
  concluida_em timestamptz,
  tentativas int NOT NULL DEFAULT 0,
  melhor_pontuacao int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, licao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lei_seca_progresso TO authenticated;
GRANT ALL ON public.lei_seca_progresso TO service_role;
ALTER TABLE public.lei_seca_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lei_seca_progresso_select_own" ON public.lei_seca_progresso FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "lei_seca_progresso_insert_own" ON public.lei_seca_progresso FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lei_seca_progresso_update_own" ON public.lei_seca_progresso FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lei_seca_progresso_delete_own" ON public.lei_seca_progresso FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
CREATE INDEX lei_seca_progresso_user_idx ON public.lei_seca_progresso (user_id, licao_id);

CREATE TABLE public.lei_seca_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  licao_id uuid NOT NULL REFERENCES public.lei_seca_licoes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'processando',
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz,
  erro text,
  UNIQUE (licao_id)
);
GRANT SELECT ON public.lei_seca_jobs TO authenticated;
GRANT ALL ON public.lei_seca_jobs TO service_role;
ALTER TABLE public.lei_seca_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lei_seca_jobs_select" ON public.lei_seca_jobs FOR SELECT USING (true);

CREATE TABLE public.lei_seca_lembretes (
  user_id uuid PRIMARY KEY,
  diario_ativo boolean NOT NULL DEFAULT false,
  diario_hora text NOT NULL DEFAULT '20:00',
  retomada_ativa boolean NOT NULL DEFAULT false,
  ultima_trilha text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lei_seca_lembretes TO authenticated;
GRANT ALL ON public.lei_seca_lembretes TO service_role;
ALTER TABLE public.lei_seca_lembretes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lei_seca_lembretes_select_own" ON public.lei_seca_lembretes FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "lei_seca_lembretes_insert_own" ON public.lei_seca_lembretes FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lei_seca_lembretes_update_own" ON public.lei_seca_lembretes FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "lei_seca_lembretes_delete_own" ON public.lei_seca_lembretes FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.lei_seca_touch_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER lei_seca_trilhas_touch BEFORE UPDATE ON public.lei_seca_trilhas FOR EACH ROW EXECUTE FUNCTION public.lei_seca_touch_updated();
CREATE TRIGGER lei_seca_licoes_touch BEFORE UPDATE ON public.lei_seca_licoes FOR EACH ROW EXECUTE FUNCTION public.lei_seca_touch_updated();
CREATE TRIGGER lei_seca_progresso_touch BEFORE UPDATE ON public.lei_seca_progresso FOR EACH ROW EXECUTE FUNCTION public.lei_seca_touch_updated();
CREATE TRIGGER lei_seca_lembretes_touch BEFORE UPDATE ON public.lei_seca_lembretes FOR EACH ROW EXECUTE FUNCTION public.lei_seca_touch_updated();

INSERT INTO public.lei_seca_trilhas (slug, nome, sigla, lei_slug, ordem, cor, partes) VALUES
('cf','Constituição Federal','CF','cf',1,'from-emerald-600 to-teal-700','[{"slug":"completa","nome":"Constituição","filtro":null}]'::jsonb),
('cp','Código Penal','CP','cp',2,'from-red-600 to-rose-800','[{"slug":"parte-geral","nome":"Parte Geral","filtro":{"art_max":120}},{"slug":"parte-especial","nome":"Parte Especial","filtro":{"art_min":121}}]'::jsonb),
('cpp','Código de Processo Penal','CPP','cpp',3,'from-orange-600 to-red-700','[{"slug":"completa","nome":"CPP","filtro":null}]'::jsonb),
('lep','Lei de Execução Penal','LEP','lei-lep',4,'from-stone-600 to-neutral-800','[{"slug":"completa","nome":"LEP","filtro":null}]'::jsonb),
('drogas','Lei de Drogas','LD','lei-drogas',5,'from-lime-600 to-green-700','[{"slug":"completa","nome":"Lei de Drogas","filtro":null}]'::jsonb),
('hediondos','Crimes Hediondos','LCH','lei-crimes-hediondos',6,'from-red-700 to-red-900','[{"slug":"completa","nome":"Crimes Hediondos","filtro":null}]'::jsonb),
('maria-penha','Lei Maria da Penha','LMP','lei-maria-penha',7,'from-rose-600 to-pink-700','[{"slug":"completa","nome":"Maria da Penha","filtro":null}]'::jsonb),
('anticrime','Pacote Anticrime','PAC','lei-pacote-anticrime',8,'from-red-600 to-orange-700','[{"slug":"completa","nome":"Pacote Anticrime","filtro":null}]'::jsonb),
('abuso-autoridade','Abuso de Autoridade','LAA','lei-abuso-autoridade',9,'from-amber-700 to-red-800','[{"slug":"completa","nome":"Abuso de Autoridade","filtro":null}]'::jsonb),
('org-criminosas','Organizações Criminosas','ORCRIM','lei-organizacoes-criminosas',10,'from-zinc-700 to-red-900','[{"slug":"completa","nome":"Organizações Criminosas","filtro":null}]'::jsonb),
('cc','Código Civil','CC','cc',11,'from-blue-600 to-indigo-700','[{"slug":"parte-geral","nome":"Parte Geral","filtro":{"art_max":232}},{"slug":"parte-especial","nome":"Parte Especial","filtro":{"art_min":233}}]'::jsonb),
('cdc','Código de Defesa do Consumidor','CDC','cdc',12,'from-pink-600 to-rose-700','[{"slug":"completa","nome":"CDC","filtro":null}]'::jsonb),
('inquilinato','Lei do Inquilinato','LI','lei-inquilinato',13,'from-sky-600 to-blue-700','[{"slug":"completa","nome":"Inquilinato","filtro":null}]'::jsonb),
('cpc','Código de Processo Civil','CPC','cpc',14,'from-cyan-600 to-blue-700','[{"slug":"completa","nome":"CPC","filtro":null}]'::jsonb),
('mandado-seguranca','Mandado de Segurança','MS','lei-mandado-seguranca',15,'from-indigo-600 to-violet-700','[{"slug":"completa","nome":"Mandado de Segurança","filtro":null}]'::jsonb),
('juizados','Juizados Especiais','JEC','lei-juizados-especiais',16,'from-orange-500 to-amber-700','[{"slug":"completa","nome":"Juizados Especiais","filtro":null}]'::jsonb),
('clt','CLT','CLT','clt',17,'from-amber-600 to-orange-700','[{"slug":"completa","nome":"CLT","filtro":null}]'::jsonb),
('ctn','Código Tributário Nacional','CTN','ctn',18,'from-yellow-600 to-amber-700','[{"slug":"completa","nome":"CTN","filtro":null}]'::jsonb),
('lei8112','Lei 8.112/90','L8112','lei-servidor',19,'from-slate-600 to-zinc-800','[{"slug":"completa","nome":"Lei 8.112","filtro":null}]'::jsonb),
('licitacoes','Lei de Licitações','L14133','lei-licitacoes',20,'from-slate-500 to-slate-700','[{"slug":"completa","nome":"Licitações","filtro":null}]'::jsonb),
('improbidade','Improbidade Administrativa','LIA','lei-improbidade',21,'from-zinc-600 to-slate-800','[{"slug":"completa","nome":"Improbidade","filtro":null}]'::jsonb),
('anticorrupcao','Lei Anticorrupção','LAC','lei-anticorrupcao',22,'from-neutral-600 to-zinc-800','[{"slug":"completa","nome":"Anticorrupção","filtro":null}]'::jsonb),
('acesso-info','Acesso à Informação','LAI','lei-acesso-informacao',23,'from-gray-600 to-slate-700','[{"slug":"completa","nome":"Acesso à Informação","filtro":null}]'::jsonb),
('ce','Código Eleitoral','CE','ce',24,'from-lime-600 to-green-700','[{"slug":"completa","nome":"Código Eleitoral","filtro":null}]'::jsonb),
('ccom','Código Comercial','CCOM','ccom',25,'from-amber-600 to-yellow-700','[{"slug":"completa","nome":"Código Comercial","filtro":null}]'::jsonb),
('cpm','Código Penal Militar','CPM','cpm',26,'from-rose-600 to-red-800','[{"slug":"completa","nome":"CPM","filtro":null}]'::jsonb),
('cppm','Código de Processo Penal Militar','CPPM','cppm',27,'from-red-700 to-rose-900','[{"slug":"completa","nome":"CPPM","filtro":null}]'::jsonb),
('ctb','Código de Trânsito Brasileiro','CTB','ctb',28,'from-sky-600 to-blue-700','[{"slug":"completa","nome":"CTB","filtro":null}]'::jsonb),
('lgpd','LGPD','LGPD','lei-lgpd',29,'from-teal-600 to-cyan-700','[{"slug":"completa","nome":"LGPD","filtro":null}]'::jsonb),
('marco-civil','Marco Civil da Internet','MCI','lei-marco-civil',30,'from-cyan-600 to-teal-700','[{"slug":"completa","nome":"Marco Civil","filtro":null}]'::jsonb),
('cba','Código Brasileiro de Aeronáutica','CBA','cba',31,'from-blue-500 to-sky-700','[{"slug":"completa","nome":"CBA","filtro":null}]'::jsonb),
('lindb','LINDB','LINDB','lei-lindb',32,'from-violet-600 to-indigo-700','[{"slug":"completa","nome":"LINDB","filtro":null}]'::jsonb),
('eca','ECA','ECA','estatuto-eca',33,'from-fuchsia-600 to-purple-700','[{"slug":"completa","nome":"ECA","filtro":null}]'::jsonb),
('idoso','Estatuto do Idoso','EI','estatuto-idoso',34,'from-purple-600 to-fuchsia-700','[{"slug":"completa","nome":"Estatuto do Idoso","filtro":null}]'::jsonb),
('desarmamento','Estatuto do Desarmamento','ED','estatuto-desarmamento',35,'from-zinc-600 to-neutral-800','[{"slug":"completa","nome":"Desarmamento","filtro":null}]'::jsonb),
('cidade','Estatuto da Cidade','EC','estatuto-cidade',36,'from-emerald-600 to-green-700','[{"slug":"completa","nome":"Estatuto da Cidade","filtro":null}]'::jsonb),
('oab','Estatuto da OAB','OAB','estatuto-oab',37,'from-blue-700 to-indigo-800','[{"slug":"completa","nome":"Estatuto da OAB","filtro":null}]'::jsonb),
('igualdade-racial','Estatuto da Igualdade Racial','EIR','estatuto-igualdade-racial',38,'from-orange-600 to-amber-700','[{"slug":"completa","nome":"Igualdade Racial","filtro":null}]'::jsonb),
('pcd','Estatuto da Pessoa com Deficiência','EPD','estatuto-pessoa-deficiencia',39,'from-teal-600 to-emerald-700','[{"slug":"completa","nome":"Estatuto da PcD","filtro":null}]'::jsonb),
('torcedor','Estatuto do Torcedor','ET','estatuto-torcedor',40,'from-green-600 to-lime-700','[{"slug":"completa","nome":"Estatuto do Torcedor","filtro":null}]'::jsonb),
('juventude','Estatuto da Juventude','EJ','estatuto-juventude',41,'from-violet-500 to-fuchsia-600','[{"slug":"completa","nome":"Estatuto da Juventude","filtro":null}]'::jsonb),
('migracao','Estatuto da Migração','EM','estatuto-migracao',42,'from-cyan-600 to-blue-700','[{"slug":"completa","nome":"Estatuto da Migração","filtro":null}]'::jsonb);
