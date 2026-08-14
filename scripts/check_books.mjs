import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'biblioteca_estudos',
  'biblioteca_classicos',
  'biblioteca_oab',
  'biblioteca_fora_da_toga',
  'biblioteca_oratoria',
  'biblioteca_lideranca',
  'biblioteca_portugues',
  'biblioteca_pesquisa_cientifica'
];

async function check() {
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .or('paginas.is.null,minutos_leitura.is.null');

    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      continue;
    }

    if (data.length > 0) {
      console.log(`\n--- Table: ${table} (${data.length} missing) ---`);
      data.forEach(book => {
        const title = book.livro || book.tema || 'Unknown Title';
        const author = book.autor || 'Unknown Author';
        console.log(`ID: ${book.id} | Title: ${title} | Author: ${author} | paginas: ${book.paginas} | minutos: ${book.minutos_leitura}`);
      });
    }
  }
}

check();
