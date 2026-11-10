-- ==============================================================================
-- MIGRAÇÃO: Prevenção Definitiva de Erro 23505 (Unique Constraint Violations)
-- Tabelas afetadas: horus_user_stats e horus_whatsapp_users
-- Projeto: ESTUDOS JURIDICOS - APP (dnjrgpldcwcpoywamorr)
-- ==============================================================================

-- 1. TRIGGER INTELIGENTE BEFORE INSERT PARA horus_user_stats
-- Resolve o erro 23505 quando uma inserção/upsert com telefone colide com user_id já existente (ou vice-versa)
CREATE OR REPLACE FUNCTION public.handle_horus_user_stats_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  -- A. Se user_id foi fornecido, procura registro existente com o mesmo user_id
  IF NEW.user_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.horus_user_stats
    WHERE user_id = NEW.user_id
    LIMIT 1;
  END IF;

  -- B. Se não encontrou por user_id mas telefone foi fornecido, procura por telefone
  IF v_existing_id IS NULL AND NEW.telefone IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.horus_user_stats
    WHERE telefone = NEW.telefone
    LIMIT 1;
  END IF;

  -- C. Se registro já existe, faz o merge seguro dos dados atualizando a linha existente
  IF v_existing_id IS NOT NULL THEN
    UPDATE public.horus_user_stats
    SET
      user_id = COALESCE(NEW.user_id, public.horus_user_stats.user_id),
      telefone = COALESCE(NEW.telefone, public.horus_user_stats.telefone),
      nome_preferido = COALESCE(NEW.nome_preferido, public.horus_user_stats.nome_preferido),
      plano_atual = COALESCE(NEW.plano_atual, public.horus_user_stats.plano_atual),
      plano_expira_em = COALESCE(NEW.plano_expira_em, public.horus_user_stats.plano_expira_em),
      contexto_formatado = COALESCE(NEW.contexto_formatado, public.horus_user_stats.contexto_formatado),
      metadata = COALESCE(public.horus_user_stats.metadata, '{}'::jsonb) || COALESCE(NEW.metadata, '{}'::jsonb),
      updated_at = NOW()
    WHERE id = v_existing_id;

    -- Retorna NULL para cancelar o INSERT concorrente sem lançar erro 23505
    RETURN NULL;
  END IF;

  -- Se for novo de fato, segue com o INSERT normal
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_horus_user_stats_duplicate ON public.horus_user_stats;
CREATE TRIGGER trg_prevent_horus_user_stats_duplicate
  BEFORE INSERT ON public.horus_user_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_horus_user_stats_upsert();


-- 2. TRIGGER INTELIGENTE BEFORE INSERT PARA horus_whatsapp_users
-- Evita colisões similares entre user_id e phone_e164
CREATE OR REPLACE FUNCTION public.handle_horus_whatsapp_users_upsert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  -- A. Procura por user_id
  IF NEW.user_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.horus_whatsapp_users
    WHERE user_id = NEW.user_id
    LIMIT 1;
  END IF;

  -- B. Procura por phone_e164
  IF v_existing_id IS NULL AND NEW.phone_e164 IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.horus_whatsapp_users
    WHERE phone_e164 = NEW.phone_e164
    LIMIT 1;
  END IF;

  -- C. Se já existe, atualiza e evita o erro 23505
  IF v_existing_id IS NOT NULL THEN
    UPDATE public.horus_whatsapp_users
    SET
      user_id = COALESCE(NEW.user_id, public.horus_whatsapp_users.user_id),
      linked_user_id = COALESCE(NEW.linked_user_id, NEW.user_id, public.horus_whatsapp_users.linked_user_id),
      phone_e164 = COALESCE(NEW.phone_e164, public.horus_whatsapp_users.phone_e164),
      display_name = COALESCE(NEW.display_name, public.horus_whatsapp_users.display_name),
      nome_preferido = COALESCE(NEW.nome_preferido, public.horus_whatsapp_users.nome_preferido),
      onboarding_state = COALESCE(NEW.onboarding_state, public.horus_whatsapp_users.onboarding_state),
      verified_at = COALESCE(NEW.verified_at, public.horus_whatsapp_users.verified_at),
      last_seen_at = NOW(),
      updated_at = NOW()
    WHERE id = v_existing_id;

    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_horus_whatsapp_users_duplicate ON public.horus_whatsapp_users;
CREATE TRIGGER trg_prevent_horus_whatsapp_users_duplicate
  BEFORE INSERT ON public.horus_whatsapp_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_horus_whatsapp_users_upsert();
