
DROP POLICY IF EXISTS "AI cache update by authenticated" ON public.artigo_ai_cache;
CREATE POLICY "AI cache update by authenticated" ON public.artigo_ai_cache
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
