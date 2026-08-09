-- Adiciona campos manuais de leitura média e páginas para todas as tabelas da biblioteca

ALTER TABLE biblioteca_estudos ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE biblioteca_estudos ADD COLUMN IF NOT EXISTS minutos_leitura INTEGER;

ALTER TABLE biblioteca_classicos ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE biblioteca_classicos ADD COLUMN IF NOT EXISTS minutos_leitura INTEGER;

ALTER TABLE biblioteca_oab ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE biblioteca_oab ADD COLUMN IF NOT EXISTS minutos_leitura INTEGER;

ALTER TABLE biblioteca_fora_da_toga ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE biblioteca_fora_da_toga ADD COLUMN IF NOT EXISTS minutos_leitura INTEGER;

ALTER TABLE biblioteca_portugues ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE biblioteca_portugues ADD COLUMN IF NOT EXISTS minutos_leitura INTEGER;

ALTER TABLE biblioteca_pesquisa_cientifica ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE biblioteca_pesquisa_cientifica ADD COLUMN IF NOT EXISTS minutos_leitura INTEGER;

ALTER TABLE biblioteca_lideranca ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE biblioteca_lideranca ADD COLUMN IF NOT EXISTS minutos_leitura INTEGER;

ALTER TABLE biblioteca_oratoria ADD COLUMN IF NOT EXISTS paginas INTEGER;
ALTER TABLE biblioteca_oratoria ADD COLUMN IF NOT EXISTS minutos_leitura INTEGER;
