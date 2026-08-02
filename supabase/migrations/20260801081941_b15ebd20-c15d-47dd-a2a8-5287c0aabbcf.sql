-- ============ CARGOS ============
CREATE TABLE public.questoes_cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  spreadsheet_id text,
  cor text NOT NULL DEFAULT '#8B5CF6',
  icone text NOT NULL DEFAULT 'Gavel',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  total_questoes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questoes_cargos TO anon;
GRANT SELECT ON public.questoes_cargos TO authenticated;
GRANT ALL ON public.questoes_cargos TO service_role;
ALTER TABLE public.questoes_cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cargos visiveis para todos" ON public.questoes_cargos FOR SELECT USING (true);

-- ============ PLANILHAS ============
CREATE TABLE public.questoes_planilhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id uuid REFERENCES public.questoes_cargos(id) ON DELETE CASCADE,
  spreadsheet_id text NOT NULL,
  spreadsheet_url text,
  sheet_name text NOT NULL DEFAULT 'Questões',
  apelido text,
  mapeamento jsonb NOT NULL DEFAULT '{}'::jsonb,
  ultima_sync timestamptz,
  total_importadas integer NOT NULL DEFAULT 0,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (spreadsheet_id, sheet_name)
);
GRANT SELECT ON public.questoes_planilhas TO authenticated;
GRANT ALL ON public.questoes_planilhas TO service_role;
ALTER TABLE public.questoes_planilhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planilhas visiveis autenticados" ON public.questoes_planilhas FOR SELECT TO authenticated USING (true);

-- ============ QUESTOES ============
CREATE TABLE public.questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hash_dedup text NOT NULL UNIQUE,
  id_externo text,
  cargo_id uuid REFERENCES public.questoes_cargos(id) ON DELETE SET NULL,
  cargo text,
  planilha_id uuid REFERENCES public.questoes_planilhas(id) ON DELETE SET NULL,
  origem text NOT NULL DEFAULT 'sheets',
  nivel text NOT NULL DEFAULT 'padrao',
  disciplina text,
  assunto text,
  area text,
  tema text,
  subtema text,
  tema_central text,
  ano integer,
  banca text,
  orgao text,
  prova text,
  numero_questao text,
  texto_associado text,
  imagem_url text,
  url_questao text,
  data_extracao text,
  enunciado text NOT NULL,
  alt_a text,
  alt_b text,
  alt_c text,
  alt_d text,
  alt_e text,
  gabarito_oficial text,
  gabarito_comentado text,
  comentario_curtido text,
  comentario_ia text,
  comentario_ia_gerado_em timestamptz,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_questoes_cargo ON public.questoes(cargo_id);
CREATE INDEX idx_questoes_disciplina ON public.questoes(disciplina);
CREATE INDEX idx_questoes_area ON public.questoes(area);
CREATE INDEX idx_questoes_nivel ON public.questoes(nivel);
CREATE INDEX idx_questoes_planilha ON public.questoes(planilha_id);
CREATE INDEX idx_questoes_sem_comentario_ia ON public.questoes(id) WHERE comentario_ia IS NULL;
GRANT SELECT ON public.questoes TO anon;
GRANT SELECT ON public.questoes TO authenticated;
GRANT ALL ON public.questoes TO service_role;
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questoes visiveis para todos" ON public.questoes FOR SELECT USING (ativo = true);

-- ============ SYNC LOG ============
CREATE TABLE public.questoes_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planilha_id uuid REFERENCES public.questoes_planilhas(id) ON DELETE CASCADE,
  origem text NOT NULL DEFAULT 'manual',
  ok boolean NOT NULL DEFAULT true,
  processadas integer NOT NULL DEFAULT 0,
  inseridas integer NOT NULL DEFAULT 0,
  ignoradas integer NOT NULL DEFAULT 0,
  erros integer NOT NULL DEFAULT 0,
  total_atual integer NOT NULL DEFAULT 0,
  mensagem text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questoes_sync_log TO authenticated;
GRANT ALL ON public.questoes_sync_log TO service_role;
ALTER TABLE public.questoes_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Log visivel autenticados" ON public.questoes_sync_log FOR SELECT TO authenticated USING (true);

-- ============ RESPOSTAS ============
CREATE TABLE public.questoes_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  questao_id uuid NOT NULL REFERENCES public.questoes(id) ON DELETE CASCADE,
  alternativa text,
  acertou boolean NOT NULL DEFAULT false,
  tempo_ms integer,
  contexto text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_qresp_user ON public.questoes_respostas(user_id, created_at DESC);
CREATE INDEX idx_qresp_questao ON public.questoes_respostas(questao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_respostas TO authenticated;
GRANT ALL ON public.questoes_respostas TO service_role;
ALTER TABLE public.questoes_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Respostas do proprio usuario" ON public.questoes_respostas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ FAVORITOS ============
CREATE TABLE public.questoes_favoritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  questao_id uuid NOT NULL REFERENCES public.questoes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, questao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_favoritos TO authenticated;
GRANT ALL ON public.questoes_favoritos TO service_role;
ALTER TABLE public.questoes_favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Favoritos do proprio usuario" ON public.questoes_favoritos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SIMULADOS ============
CREATE TABLE public.questoes_simulados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  cargo_id uuid REFERENCES public.questoes_cargos(id) ON DELETE SET NULL,
  cargo text,
  total integer NOT NULL DEFAULT 0,
  acertos integer NOT NULL DEFAULT 0,
  duracao_seg integer,
  status text NOT NULL DEFAULT 'em_andamento',
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_qsim_user ON public.questoes_simulados(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_simulados TO authenticated;
GRANT ALL ON public.questoes_simulados TO service_role;
ALTER TABLE public.questoes_simulados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Simulados do proprio usuario" ON public.questoes_simulados FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.questoes_simulado_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulado_id uuid NOT NULL REFERENCES public.questoes_simulados(id) ON DELETE CASCADE,
  questao_id uuid NOT NULL REFERENCES public.questoes(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  alternativa text,
  acertou boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_qsimitem_sim ON public.questoes_simulado_itens(simulado_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_simulado_itens TO authenticated;
GRANT ALL ON public.questoes_simulado_itens TO service_role;
ALTER TABLE public.questoes_simulado_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Itens do proprio simulado" ON public.questoes_simulado_itens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.questoes_simulados s WHERE s.id = simulado_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.questoes_simulados s WHERE s.id = simulado_id AND s.user_id = auth.uid()));

-- ============ TRILHAS ============
CREATE TABLE public.questoes_trilhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  tipo text NOT NULL DEFAULT 'diaria',
  area text,
  cargo_id uuid REFERENCES public.questoes_cargos(id) ON DELETE SET NULL,
  meta_diaria integer NOT NULL DEFAULT 10,
  total_meta integer,
  cor text NOT NULL DEFAULT '#8B5CF6',
  icone text NOT NULL DEFAULT 'Route',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questoes_trilhas TO anon;
GRANT SELECT ON public.questoes_trilhas TO authenticated;
GRANT ALL ON public.questoes_trilhas TO service_role;
ALTER TABLE public.questoes_trilhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trilhas visiveis para todos" ON public.questoes_trilhas FOR SELECT USING (ativo = true);

CREATE TABLE public.questoes_trilha_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trilha_id uuid NOT NULL REFERENCES public.questoes_trilhas(id) ON DELETE CASCADE,
  dia date NOT NULL DEFAULT CURRENT_DATE,
  respondidas integer NOT NULL DEFAULT 0,
  acertos integer NOT NULL DEFAULT 0,
  concluido boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, trilha_id, dia)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questoes_trilha_progresso TO authenticated;
GRANT ALL ON public.questoes_trilha_progresso TO service_role;
ALTER TABLE public.questoes_trilha_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Progresso do proprio usuario" ON public.questoes_trilha_progresso FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ TRIGGER updated_at ============
CREATE OR REPLACE FUNCTION public.questoes_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_questoes_cargos_upd BEFORE UPDATE ON public.questoes_cargos FOR EACH ROW EXECUTE FUNCTION public.questoes_touch_updated_at();
CREATE TRIGGER trg_questoes_planilhas_upd BEFORE UPDATE ON public.questoes_planilhas FOR EACH ROW EXECUTE FUNCTION public.questoes_touch_updated_at();
CREATE TRIGGER trg_questoes_upd BEFORE UPDATE ON public.questoes FOR EACH ROW EXECUTE FUNCTION public.questoes_touch_updated_at();
CREATE TRIGGER trg_questoes_trilhas_upd BEFORE UPDATE ON public.questoes_trilhas FOR EACH ROW EXECUTE FUNCTION public.questoes_touch_updated_at();
CREATE TRIGGER trg_questoes_trilha_prog_upd BEFORE UPDATE ON public.questoes_trilha_progresso FOR EACH ROW EXECUTE FUNCTION public.questoes_touch_updated_at();