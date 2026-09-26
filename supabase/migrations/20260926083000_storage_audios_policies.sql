-- Permissões na tabela storage.objects para o bucket 'audios'
-- Permite leitura, upload, atualização e exclusão de arquivos de áudio de narração das leis

DROP POLICY IF EXISTS "audios_select_all" ON storage.objects;
DROP POLICY IF EXISTS "audios_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "audios_update_all" ON storage.objects;
DROP POLICY IF EXISTS "audios_delete_all" ON storage.objects;

CREATE POLICY "audios_select_all" ON storage.objects 
  FOR SELECT USING (bucket_id = 'audios');

CREATE POLICY "audios_insert_all" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'audios');

CREATE POLICY "audios_update_all" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'audios') WITH CHECK (bucket_id = 'audios');

CREATE POLICY "audios_delete_all" ON storage.objects 
  FOR DELETE USING (bucket_id = 'audios');
