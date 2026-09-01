-- Dashboard de push: o admin precisa contar os dispositivos registrados.
-- A policy existente (users_manage_own_tokens) só permite ver os próprios tokens,
-- por isso o card "Devices" mostrava 0 mesmo com dezenas de tokens ativos.
CREATE POLICY "admin reads device tokens"
  ON public.device_tokens
  FOR SELECT
  TO authenticated
  USING (((select auth.jwt()) ->> 'email') = 'wn7corporation@gmail.com');