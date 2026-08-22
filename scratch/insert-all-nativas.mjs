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

async function insertAllMissing() {
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

  let totalInserted = 0;

  for (const table of tables) {
    console.log(`\nVerificando tabela: ${table}...`);
    
    try {
      const { data: books, error } = await supabase.from(table).select('id');
      if (error) {
        console.error(`Erro ao buscar de ${table}:`, error.message);
        continue;
      }
      
      const { data: nativeReadings, error: nativeError } = await supabase
        .from('biblioteca_leitura_nativa')
        .select('livro_id')
        .eq('livro_tabela', table);

      if (nativeError) {
        console.error(`Erro ao buscar nativas para ${table}:`, nativeError.message);
        continue;
      }

      const nativeReadingSet = new Set(nativeReadings.map(nr => nr.livro_id));
      const missingBooks = [];

      for (const book of books) {
        if (!nativeReadingSet.has(book.id.toString())) {
          missingBooks.push(book);
        }
      }

      console.log(`Encontrados ${missingBooks.length} livros sem leitura nativa.`);

      if (missingBooks.length === 0) continue;

      // Inserting sequentially to avoid rate limits
      for (const book of missingBooks) {
        const { error: insertError } = await supabase
          .from('biblioteca_leitura_nativa')
          .insert({
            livro_id: book.id.toString(),
            livro_tabela: table,
            status: 'pendente',
          });
          
        if (insertError) {
          console.error(`Erro ao inserir ID ${book.id}:`, insertError.message);
        } else {
          totalInserted++;
        }
      }
      
      console.log(`Inserções concluídas para ${table}.`);

    } catch (e) {
      console.error(`Exceção na tabela ${table}:`, e.message);
    }
  }
  
  console.log(`\nProcesso finalizado. Total inserido: ${totalInserted}`);
}

insertAllMissing();
