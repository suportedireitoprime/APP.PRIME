
CREATE POLICY "admin full access whatsapp users"
  ON public.horus_whatsapp_users FOR ALL
  TO authenticated
  USING (public.is_admin_user((select auth.uid())))
  WITH CHECK (public.is_admin_user((select auth.uid())));

CREATE POLICY "admin full access conversations"
  ON public.horus_conversations FOR ALL
  TO authenticated
  USING (public.is_admin_user((select auth.uid())))
  WITH CHECK (public.is_admin_user((select auth.uid())));
