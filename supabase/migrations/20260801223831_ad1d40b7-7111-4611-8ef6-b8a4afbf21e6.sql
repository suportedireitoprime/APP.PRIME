CREATE POLICY "Admins enviam audios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audios' AND public.is_admin_email());

CREATE POLICY "Admins atualizam audios"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'audios' AND public.is_admin_email())
WITH CHECK (bucket_id = 'audios' AND public.is_admin_email());

CREATE POLICY "Admins apagam audios"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'audios' AND public.is_admin_email());