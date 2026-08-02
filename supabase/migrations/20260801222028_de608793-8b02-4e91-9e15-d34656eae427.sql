GRANT SELECT ON public.audioaulas_acervo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audioaulas_acervo TO authenticated;
GRANT ALL ON public.audioaulas_acervo TO service_role;

GRANT SELECT ON public.leis_cantadas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leis_cantadas TO authenticated;
GRANT ALL ON public.leis_cantadas TO service_role;

GRANT SELECT ON public.resumos_cantados TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumos_cantados TO authenticated;
GRANT ALL ON public.resumos_cantados TO service_role;