-- Padronização das novas colunas da planilha atualizada OAB v2
ALTER TABLE simulado_questions ADD COLUMN IF NOT EXISTS id_externo TEXT;
ALTER TABLE simulado_questions ADD COLUMN IF NOT EXISTS numero_questao INTEGER;
ALTER TABLE simulado_questions ADD COLUMN IF NOT EXISTS base_legal TEXT;
ALTER TABLE simulado_questions ADD COLUMN IF NOT EXISTS codigo_externo TEXT;
ALTER TABLE simulado_questions ADD COLUMN IF NOT EXISTS dificuldade TEXT;
ALTER TABLE simulado_questions ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE simulado_questions ADD COLUMN IF NOT EXISTS fonte TEXT;
ALTER TABLE simulado_questions ADD COLUMN IF NOT EXISTS observacao TEXT;

ALTER TABLE questoes ADD COLUMN IF NOT EXISTS base_legal TEXT;
ALTER TABLE questoes ADD COLUMN IF NOT EXISTS fonte TEXT;
ALTER TABLE questoes ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE questoes ADD COLUMN IF NOT EXISTS status_questao TEXT;

