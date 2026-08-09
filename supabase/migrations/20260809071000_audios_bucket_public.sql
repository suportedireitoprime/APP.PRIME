-- Torna o bucket 'audios' público para que a URL gerada por getPublicUrl() funcione corretamente no player de áudio
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audios';
