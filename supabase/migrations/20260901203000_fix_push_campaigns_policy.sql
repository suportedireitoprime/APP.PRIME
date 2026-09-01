-- Fix Auth RLS initplan for push_campaigns
DROP POLICY IF EXISTS "admin manages push campaigns" ON public.push_campaigns;
CREATE POLICY "admin manages push campaigns" ON public.push_campaigns
  FOR ALL TO authenticated
  USING ((SELECT (auth.jwt() ->> 'email'::text)) = 'wn7corporation@gmail.com'::text)
  WITH CHECK ((SELECT (auth.jwt() ->> 'email'::text)) = 'wn7corporation@gmail.com'::text);
