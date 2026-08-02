CREATE POLICY "Audios sao publicos para leitura"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'audios');

CREATE POLICY "Service role gerencia audios"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'audios')
WITH CHECK (bucket_id = 'audios');