-- Fix handle_onboarding_completed to safely ignore unconfigured edge function URL
CREATE OR REPLACE FUNCTION public.handle_onboarding_completed()
RETURNS TRIGGER AS $$
DECLARE
  base_url text;
BEGIN
  base_url := current_setting('app.settings.edge_function_base_url', true);
  IF base_url IS NOT NULL AND base_url <> '' AND OLD.onboarding_completed_at IS NULL AND NEW.onboarding_completed_at IS NOT NULL THEN
    PERFORM net.http_post(
      url := base_url || '/onboarding-webhook',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.service_role_key', true), '')
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
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
