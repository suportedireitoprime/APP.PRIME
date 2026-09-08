-- Trigger para acionar a Edge Function 'onboarding-webhook' quando o onboarding é completado

-- 1. Garante que a extensão de requisicões HTTP existe (se não, habilita)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Cria a função que constrói e envia o webhook
CREATE OR REPLACE FUNCTION public.handle_onboarding_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Só dispara se o status anterior era nulo e o novo não é (acabou de completar)
  IF OLD.onboarding_completed_at IS NULL AND NEW.onboarding_completed_at IS NOT NULL THEN
    
    -- Envia um POST para a Edge Function
    PERFORM net.http_post(
      url := current_setting('app.settings.edge_function_base_url', true) || '/onboarding-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'profiles',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cria a trigger na tabela profiles
DROP TRIGGER IF EXISTS on_onboarding_completed ON public.profiles;
CREATE TRIGGER on_onboarding_completed
  AFTER UPDATE OF onboarding_completed_at ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_onboarding_completed();
