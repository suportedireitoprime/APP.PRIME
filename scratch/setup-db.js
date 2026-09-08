import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL || '');

async function setup() {
  try {
    await sql`
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
    `;
    console.log('Table created successfully');
    
    // Enable RLS
    await sql`ALTER TABLE gamificacao_jogos ENABLE ROW LEVEL SECURITY;`;
    
    // Create public read policy if not exists
    await sql`
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
    `;
    console.log('RLS policies setup correctly');

  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
setup();
