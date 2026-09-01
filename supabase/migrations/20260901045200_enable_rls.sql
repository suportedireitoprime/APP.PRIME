-- Enable RLS for tables missing it
ALTER TABLE public.aprender_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aprender_blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aprender_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vademecum_config_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vademecum_historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- If there are no policies for `vademecum_config_ia` and `vademecum_historico_alteracoes`,
-- we might want to add default read access for authenticated users, but the error
-- specifically says "RLS Disabled in Public", we just need to enable RLS for them.
-- They might already have policies, or it might just be needed to prevent public access.
