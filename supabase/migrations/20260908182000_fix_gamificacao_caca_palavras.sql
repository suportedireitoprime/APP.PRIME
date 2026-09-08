-- Concede os privilégios básicos que faltaram
GRANT ALL ON TABLE public.gamificacao_caca_palavras TO anon;
GRANT ALL ON TABLE public.gamificacao_caca_palavras TO authenticated;
GRANT ALL ON TABLE public.gamificacao_caca_palavras TO service_role;

-- Corrige o problema de encoding dos dados previamente inseridos
UPDATE public.gamificacao_caca_palavras
SET materia = 'Crimes Contra a Família'
WHERE materia LIKE 'Crimes Contra a Fam%';

UPDATE public.gamificacao_caca_palavras
SET nivel = 'Nível 1' WHERE nivel LIKE 'N%vel 1%';
UPDATE public.gamificacao_caca_palavras
SET nivel = 'Nível 2' WHERE nivel LIKE 'N%vel 2%';
UPDATE public.gamificacao_caca_palavras
SET nivel = 'Nível 3' WHERE nivel LIKE 'N%vel 3%';
UPDATE public.gamificacao_caca_palavras
SET nivel = 'Nível 4' WHERE nivel LIKE 'N%vel 4%';
UPDATE public.gamificacao_caca_palavras
SET nivel = 'Nível 5' WHERE nivel LIKE 'N%vel 5%';

UPDATE public.gamificacao_caca_palavras
SET titulo_nivel = 'Básico - Crimes Contra o Estado de Filiação' WHERE titulo_nivel LIKE 'B%sico%';
UPDATE public.gamificacao_caca_palavras
SET titulo_nivel = 'Intermediário - Assistência Familiar e Abandono' WHERE titulo_nivel LIKE 'Intermedi%rio%';
UPDATE public.gamificacao_caca_palavras
SET titulo_nivel = 'Avançado - Pátrio Poder, Tutela e Subtração' WHERE titulo_nivel LIKE 'Avan%ado%';

-- Adiciona a política de update para service_role e authenticated se faltar
DROP POLICY IF EXISTS "Permitir leitura pública para caca palavras" ON gamificacao_caca_palavras;

CREATE POLICY "Permitir leitura pública para caca palavras" 
ON gamificacao_caca_palavras 
FOR SELECT 
USING (true);
