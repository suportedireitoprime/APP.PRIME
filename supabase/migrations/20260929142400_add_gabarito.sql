-- Migration to add gabarito to simulado_questions
ALTER TABLE public.simulado_questions
ADD COLUMN IF NOT EXISTS gabarito TEXT;
