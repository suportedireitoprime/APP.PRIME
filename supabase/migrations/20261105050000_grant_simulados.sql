-- Permissões de leitura para Simulados e Questões no aplicativo
GRANT SELECT ON public.simulado_exams TO anon, authenticated;
GRANT SELECT ON public.simulados TO anon, authenticated;
GRANT SELECT ON public.simulado_questions TO anon, authenticated;

-- Garantir políticas RLS de leitura pública para as tabelas de simulado
DO $$
BEGIN
    -- simulado_exams
    ALTER TABLE public.simulado_exams ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "simulado_exams_read_policy" ON public.simulado_exams;
    CREATE POLICY "simulado_exams_read_policy" ON public.simulado_exams FOR SELECT USING (true);

    -- simulados
    ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "simulados_read_policy" ON public.simulados;
    CREATE POLICY "simulados_read_policy" ON public.simulados FOR SELECT USING (true);

    -- simulado_questions
    ALTER TABLE public.simulado_questions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "simulado_questions_read_policy" ON public.simulado_questions;
    CREATE POLICY "simulado_questions_read_policy" ON public.simulado_questions FOR SELECT USING (true);
END $$;

