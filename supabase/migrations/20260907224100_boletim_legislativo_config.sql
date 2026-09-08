-- Migration para Boletim Legislativo
ALTER TABLE public.boletim_config
ADD COLUMN IF NOT EXISTS legislativo_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS legislativo_horario time without time zone DEFAULT '10:00:00',
ADD COLUMN IF NOT EXISTS legislativo_voz_id text DEFAULT 'Kore',
ADD COLUMN IF NOT EXISTS legislativo_max_itens integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS legislativo_prompt_tts_extra text;
