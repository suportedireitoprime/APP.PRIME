import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Faltando VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const outDir = path.join(root, 'public', 'offline-bundle');

const tables = [
  { table: 'biblioteca_estudos', name: 'biblioteca-estudos' },
  { table: 'biblioteca_classicos', name: 'biblioteca-classicos' },
  { table: 'biblioteca_oab', name: 'biblioteca-oab' },
  { table: 'biblioteca_fora_da_toga', name: 'biblioteca-fora-da-toga' },
  { table: 'biblioteca_oratoria', name: 'biblioteca-oratoria' },
  { table: 'biblioteca_lideranca', name: 'biblioteca-lideranca' },
  { table: 'biblioteca_portugues', name: 'biblioteca-portugues' },
  { table: 'biblioteca_pesquisa_cientifica', name: 'biblioteca-pesquisa-cientifica' }
];

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  for (const t of tables) {
    console.log(`Buscando ${t.table}...`);
    const { data, error } = await supabase.from(t.table).select('*').limit(3000);
    if (error) {
      console.error('Erro:', error);
      continue;
    }
    await fs.writeFile(path.join(outDir, `${t.name}.json`), JSON.stringify(data));
    console.log(`Salvo ${t.name}.json com ${data.length} registros.`);
  }
}

run().catch(console.error);
