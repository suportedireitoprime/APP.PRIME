CREATE TABLE public.app_transfer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Novo app',
  valores JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_transfer_profiles TO authenticated;
GRANT ALL ON public.app_transfer_profiles TO service_role;

ALTER TABLE public.app_transfer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their transfer profiles"
ON public.app_transfer_profiles FOR ALL TO authenticated
USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

CREATE TRIGGER update_app_transfer_profiles_updated_at
BEFORE UPDATE ON public.app_transfer_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();