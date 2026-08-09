-- Criar políticas de UPDATE para admins em todas as tabelas da biblioteca
-- Necessário para o painel de upload de áudios funcionar corretamente

CREATE POLICY "Admin update estudos" ON biblioteca_estudos 
FOR UPDATE TO authenticated 
USING (is_admin_user(auth.uid())) 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin update classicos" ON biblioteca_classicos 
FOR UPDATE TO authenticated 
USING (is_admin_user(auth.uid())) 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin update oab" ON biblioteca_oab 
FOR UPDATE TO authenticated 
USING (is_admin_user(auth.uid())) 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin update fora_da_toga" ON biblioteca_fora_da_toga 
FOR UPDATE TO authenticated 
USING (is_admin_user(auth.uid())) 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin update lideranca" ON biblioteca_lideranca 
FOR UPDATE TO authenticated 
USING (is_admin_user(auth.uid())) 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin update portugues" ON biblioteca_portugues 
FOR UPDATE TO authenticated 
USING (is_admin_user(auth.uid())) 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin update pesquisa_cientifica" ON biblioteca_pesquisa_cientifica 
FOR UPDATE TO authenticated 
USING (is_admin_user(auth.uid())) 
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admin update oratoria" ON biblioteca_oratoria 
FOR UPDATE TO authenticated 
USING (is_admin_user(auth.uid())) 
WITH CHECK (is_admin_user(auth.uid()));
