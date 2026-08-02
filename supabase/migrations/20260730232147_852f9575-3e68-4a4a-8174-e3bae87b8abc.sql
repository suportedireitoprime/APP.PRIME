DO $$
DECLARE t record; has_priv boolean;
BEGIN
  FOR t IN SELECT c.relname AS tn FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    SELECT EXISTS (SELECT 1 FROM information_schema.role_table_grants
      WHERE grantee='authenticated' AND table_schema='public' AND table_name=t.tn
        AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) INTO has_priv;
    IF NOT has_priv THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.tn);
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.role_table_grants
      WHERE grantee='service_role' AND table_schema='public' AND table_name=t.tn
        AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) INTO has_priv;
    IF NOT has_priv THEN
      EXECUTE format('GRANT ALL ON public.%I TO service_role', t.tn);
    END IF;
  END LOOP;
END $$;

-- leitura anônima apenas onde já existe política SELECT permissiva para public/anon
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT DISTINCT p.tablename AS tn
    FROM pg_policies p
    WHERE p.schemaname='public'
      AND p.cmd IN ('SELECT','ALL')
      AND (p.roles::text[] && ARRAY['public','anon'])
      AND coalesce(p.qual,'true') NOT ILIKE '%auth.uid()%'
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t.tn);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;