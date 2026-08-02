CREATE POLICY "temp_anon_update_audioaulas" ON public.audioaulas_acervo FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT UPDATE ON public.audioaulas_acervo TO anon;