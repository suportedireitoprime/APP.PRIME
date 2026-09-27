-- Adiciona coluna para persistência de conteúdo completo do edital/concurso
ALTER TABLE public.concursos_noticias 
ADD COLUMN IF NOT EXISTS conteudo_md TEXT;

-- Permitir leitura pública (já coberto pela select_policy, mas assegurando consistência)
GRANT SELECT ON public.concursos_noticias TO anon, authenticated;
