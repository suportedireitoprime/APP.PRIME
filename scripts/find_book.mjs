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

async function findBookEverywhere() {
  for (const table of tables) {
    const titleField = ['biblioteca_estudos', 'biblioteca_oab'].includes(table) ? 'tema' : 'livro';
    
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${titleField}, paginas, minutos_leitura`)
      .ilike(titleField, '%liberdade%');

    if (error) {
      console.error(error);
    } else if (data && data.length > 0) {
      console.log(`Found in ${table}:`, data);
    }
  }
}

findBookEverywhere();
