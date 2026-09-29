CREATE POLICY "Enable all access for authenticated users on simulado_exams" ON public.simulado_exams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users on simulados" ON public.simulados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users on simulado_questions" ON public.simulado_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
