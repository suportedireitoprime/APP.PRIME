CREATE TABLE IF NOT EXISTS public.forca_artigos_progresso (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    artigo_id uuid REFERENCES public.vade_mecum_artigos(id) ON DELETE CASCADE,
    stars int NOT NULL CHECK (stars >= 1 AND stars <= 3),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, artigo_id)
);

ALTER TABLE public.forca_artigos_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio progresso de artigos"
ON public.forca_artigos_progresso FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Usuários podem inserir seu próprio progresso de artigos"
ON public.forca_artigos_progresso FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso de artigos"
ON public.forca_artigos_progresso FOR UPDATE
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Função para atualizar estrelas (mantém a maior estrela)
CREATE OR REPLACE FUNCTION upsert_forca_article_stars(
  p_user_id uuid,
  p_artigo_id uuid,
  p_stars int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stars int;
BEGIN
  SELECT stars INTO v_current_stars
  FROM forca_artigos_progresso
  WHERE user_id = p_user_id AND artigo_id = p_artigo_id;

  IF FOUND THEN
    IF p_stars > v_current_stars THEN
      UPDATE forca_artigos_progresso
      SET stars = p_stars, updated_at = now()
      WHERE user_id = p_user_id AND artigo_id = p_artigo_id;
    END IF;
  ELSE
    INSERT INTO forca_artigos_progresso (user_id, artigo_id, stars)
    VALUES (p_user_id, p_artigo_id, p_stars);
  END IF;
END;
$$;
