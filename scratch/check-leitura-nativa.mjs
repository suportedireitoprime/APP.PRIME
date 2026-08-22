import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeituraNativa() {
  const tables = [
    'biblioteca_classicos',
    'biblioteca_estudos',
    'biblioteca_fora_da_toga',
    'biblioteca_lideranca',
    'biblioteca_oab',
    'biblioteca_oratoria',
    'biblioteca_pesquisa_cientifica',
    'biblioteca_portugues',
    'biblioteca_livros'
  ];

  let totalBooks = 0;
  let booksWithNativeReading = 0;
  let missingBooks = [];

  for (const table of tables) {
    try {
      const { data: books, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`Error fetching from ${table}:`, error.message);
        continue;
      }
      
      const { data: nativeReadings, error: nativeError } = await supabase
        .from('biblioteca_leitura_nativa')
        .select('livro_id, status')
        .eq('livro_tabela', table);

      if (nativeError) {
        console.error(`Error fetching native readings for ${table}:`, nativeError.message);
        continue;
      }

      const nativeReadingSet = new Set(nativeReadings.map(nr => nr.livro_id));
      
      let tableMissing = 0;
      for (const book of books) {
        if (!nativeReadingSet.has(book.id.toString())) {
          missingBooks.push({ table, title: book.titulo || book.livro || 'Unknown', id: book.id });
          tableMissing++;
        }
      }

      console.log(`Table ${table}: ${books.length} books, ${nativeReadings.length} have native reading. Missing: ${tableMissing}`);
      
      totalBooks += books.length;
      booksWithNativeReading += nativeReadings.length;

    } catch (e) {
      console.error(`Exception on table ${table}:`, e.message);
    }
  }

  console.log(`\n--- SUMMARY ---`);
  console.log(`Total books across tables: ${totalBooks}`);
  console.log(`Books with native reading entry: ${booksWithNativeReading}`);
  console.log(`Books MISSING native reading entry: ${missingBooks.length}`);

  if (missingBooks.length > 0) {
    console.log(`\nSample of missing books (up to 10):`);
    console.log(missingBooks.slice(0, 10).map(b => `- [${b.table}] ${b.title}`).join('\n'));
  }
}

checkLeituraNativa();
