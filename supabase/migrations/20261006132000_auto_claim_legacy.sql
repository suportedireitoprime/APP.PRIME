-- Migration to automatically link legacy_subscribers on account creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_legacy boolean;
BEGIN
  -- 1. Cria perfil do usuário
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Linka automaticamente assinantes antigos (legacy_subscribers) ao seu user_id
  UPDATE public.legacy_subscribers
  SET claimed_user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND claimed_user_id IS NULL
  RETURNING true INTO v_is_legacy;

  -- 3. Se era um legacy subscriber ativo, cria a assinatura no asaas_subscriptions para garantir acesso
  IF v_is_legacy THEN
    -- Apenas cria o registro base se não existir
    INSERT INTO public.asaas_subscriptions (user_id, status, asaas_customer_id, asaas_subscription_id)
    SELECT NEW.id, 'ACTIVE', 'legacy_' || NEW.id, 'legacy_sub_' || NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.asaas_subscriptions WHERE user_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;
