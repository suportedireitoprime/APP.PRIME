CREATE TABLE IF NOT EXISTS gamificacao_jogos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_jogo TEXT NOT NULL,
  disciplina TEXT,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  artigo TEXT,
  dificuldade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE gamificacao_jogos ENABLE ROW LEVEL SECURITY;

-- Create public read policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'gamificacao_jogos' AND policyname = 'Permitir leitura publica gamificacao_jogos'
  ) THEN
      CREATE POLICY "Permitir leitura publica gamificacao_jogos" 
      ON gamificacao_jogos FOR SELECT USING (true);
  END IF;
END
$$;
