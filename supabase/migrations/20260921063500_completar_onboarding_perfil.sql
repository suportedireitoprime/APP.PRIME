-- RPC seguro para completar o onboarding e salvar o perfil sem conflito de RLS
CREATE OR REPLACE FUNCTION public.completar_onboarding_perfil(
  _user_id uuid,
  _status_perfil text,
  _faixa_etaria text,
  _perfil_contexto text,
  _display_name text,
  _areas_interesse text[],
  _interesses text[],
  _whatsapp text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _target_id uuid := COALESCE(auth.uid(), _user_id);
  _now timestamptz := now();
BEGIN
  IF _target_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No user ID provided');
  END IF;

  INSERT INTO public.profiles (
    id,
    status_perfil,
    faixa_etaria,
    perfil_tipos,
    perfil_contexto,
    display_name,
    areas_interesse,
    interesses,
    telefone,
    whatsapp_number,
    onboarding_completed_at,
    updated_at
  ) VALUES (
    _target_id,
    _status_perfil,
    _faixa_etaria,
    CASE WHEN _status_perfil IS NOT NULL THEN ARRAY[_status_perfil] ELSE NULL END,
    _perfil_contexto,
    _display_name,
    coalesce(_areas_interesse, ARRAY[]::text[]),
    coalesce(_interesses, ARRAY[]::text[]),
    _whatsapp,
    _whatsapp,
    _now,
    _now
  )
  ON CONFLICT (id) DO UPDATE SET
    status_perfil = EXCLUDED.status_perfil,
    faixa_etaria = EXCLUDED.faixa_etaria,
    perfil_tipos = EXCLUDED.perfil_tipos,
    perfil_contexto = EXCLUDED.perfil_contexto,
    display_name = COALESCE(EXCLUDED.display_name, public.profiles.display_name),
    areas_interesse = EXCLUDED.areas_interesse,
    interesses = EXCLUDED.interesses,
    telefone = COALESCE(EXCLUDED.telefone, public.profiles.telefone),
    whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, public.profiles.whatsapp_number),
    onboarding_completed_at = _now,
    updated_at = _now;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.completar_onboarding_perfil(uuid, text, text, text, text, text[], text[], text) TO anon, authenticated, service_role;
