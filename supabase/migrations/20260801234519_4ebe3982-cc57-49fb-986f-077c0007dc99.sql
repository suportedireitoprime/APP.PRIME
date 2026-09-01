CREATE OR REPLACE FUNCTION public.registrar_play(p_musica_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leis_cantadas_stats (lei_cantada_id, plays, likes)
  VALUES (p_musica_id, 1, 0)
  ON CONFLICT (lei_cantada_id)
  DO UPDATE SET plays = public.leis_cantadas_stats.plays + 1, updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.alternar_curtida(p_musica_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (select auth.uid());
  v_existe uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  SELECT id INTO v_existe
  FROM public.leis_cantadas_reacoes
  WHERE lei_cantada_id = p_musica_id AND created_by = v_uid AND tipo = 'like';

  IF v_existe IS NOT NULL THEN
    DELETE FROM public.leis_cantadas_reacoes WHERE id = v_existe;
    INSERT INTO public.leis_cantadas_stats (lei_cantada_id, plays, likes)
    VALUES (p_musica_id, 0, 0)
    ON CONFLICT (lei_cantada_id)
    DO UPDATE SET likes = GREATEST(0, public.leis_cantadas_stats.likes - 1), updated_at = now();
    RETURN false;
  END IF;

  INSERT INTO public.leis_cantadas_reacoes (lei_cantada_id, created_by, tipo)
  VALUES (p_musica_id, v_uid, 'like');
  INSERT INTO public.leis_cantadas_stats (lei_cantada_id, plays, likes)
  VALUES (p_musica_id, 0, 1)
  ON CONFLICT (lei_cantada_id)
  DO UPDATE SET likes = public.leis_cantadas_stats.likes + 1, updated_at = now();
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_play(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.alternar_curtida(uuid) TO authenticated, service_role;