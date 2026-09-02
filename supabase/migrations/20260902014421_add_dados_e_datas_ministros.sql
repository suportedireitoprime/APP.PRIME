-- Adiciona coluna JSONB para armazenar a linha do tempo (Dados e Datas) de cada ministro
ALTER TABLE public.stf_ministros
ADD COLUMN IF NOT EXISTS dados_e_datas jsonb DEFAULT NULL;

COMMENT ON COLUMN public.stf_ministros.dados_e_datas IS 'Array JSON com eventos da linha do tempo do ministro (indicação, posse, aposentadoria etc). Cada item: { etapa, pdf_url, ocr_text }';
