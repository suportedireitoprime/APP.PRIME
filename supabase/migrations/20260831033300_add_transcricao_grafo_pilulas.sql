ALTER TABLE vade_mecum_artigos ADD COLUMN IF NOT EXISTS audio_transcricao TEXT; ALTER TABLE vade_mecum_artigos ADD COLUMN IF NOT EXISTS audio_grafo JSONB;
