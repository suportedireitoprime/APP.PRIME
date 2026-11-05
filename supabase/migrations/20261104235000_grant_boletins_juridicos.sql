-- Permissao de leitura publica para boletins_juridicos no app
GRANT SELECT ON public.boletins_juridicos TO anon, authenticated;

-- Garantir politica RLS de leitura publica se RLS estiver ativo
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'boletins_juridicos'
    ) THEN
        ALTER TABLE public.boletins_juridicos ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Boletins visiveis para todos" ON public.boletins_juridicos;
        CREATE POLICY "Boletins visiveis para todos" ON public.boletins_juridicos 
            FOR SELECT USING (true);
    END IF;
END $$;
