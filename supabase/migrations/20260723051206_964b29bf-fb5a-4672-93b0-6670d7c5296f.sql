
-- aprender_aulas: admin vê e gerencia tudo
CREATE POLICY "Admin vê todas as aulas"
  ON public.aprender_aulas FOR SELECT TO authenticated
  USING (public.is_admin_user((select auth.uid())));

CREATE POLICY "Admin gerencia aulas"
  ON public.aprender_aulas FOR ALL TO authenticated
  USING (public.is_admin_user((select auth.uid())))
  WITH CHECK (public.is_admin_user((select auth.uid())));

-- aprender_blocos: admin vê e gerencia tudo
CREATE POLICY "Admin vê todos os blocos"
  ON public.aprender_blocos FOR SELECT TO authenticated
  USING (public.is_admin_user((select auth.uid())));

CREATE POLICY "Admin gerencia blocos"
  ON public.aprender_blocos FOR ALL TO authenticated
  USING (public.is_admin_user((select auth.uid())))
  WITH CHECK (public.is_admin_user((select auth.uid())));
