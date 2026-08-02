DROP POLICY IF EXISTS "temp_anon_upload_audios" ON storage.objects;
DROP POLICY IF EXISTS "temp_anon_update_audioaulas" ON public.audioaulas_acervo;
REVOKE UPDATE ON public.audioaulas_acervo FROM anon;