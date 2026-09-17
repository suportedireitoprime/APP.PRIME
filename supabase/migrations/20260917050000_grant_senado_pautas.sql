GRANT ALL ON TABLE public.senado_pautas TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
