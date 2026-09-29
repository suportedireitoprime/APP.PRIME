-- Migration to add disciplina and assunto to simulado_questions
ALTER TABLE public.simulado_questions
ADD COLUMN IF NOT EXISTS disciplina TEXT,
ADD COLUMN IF NOT EXISTS assunto TEXT;
