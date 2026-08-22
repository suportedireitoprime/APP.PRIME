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

async function insertOab() {
  const table = 'biblioteca_oab';
  
  console.log(`Buscando livros da tabela ${table}...`);
  const { data: books, error } = await supabase.from(table).select('*');
  if (error) {
    console.error(`Erro ao buscar:`, error.message);
    return;
  }
  
  const { data: nativeReadings, error: nativeError } = await supabase
    .from('biblioteca_leitura_nativa')
    .select('livro_id')
    .eq('livro_tabela', table);

  if (nativeError) {
    console.error(`Erro ao buscar nativas:`, nativeError.message);
    return;
  }

  const nativeReadingSet = new Set(nativeReadings.map(nr => nr.livro_id));
  const missingBooks = [];

  for (const book of books) {
    if (!nativeReadingSet.has(book.id.toString())) {
      missingBooks.push(book);
    }
  }

  console.log(`Encontrados ${missingBooks.length} livros sem leitura nativa.`);

  for (const book of missingBooks) {
    console.log(`Inserindo leitura nativa para o livro: ${book.titulo || book.livro || 'Unknown'} (ID: ${book.id})`);
    
    const { error: insertError } = await supabase
      .from('biblioteca_leitura_nativa')
      .insert({
        livro_id: book.id.toString(),
        livro_tabela: table,
        status: 'pendente',
      });
      
    if (insertError) {
      console.error(`Erro ao inserir ${book.id}:`, insertError.message);
    } else {
      console.log(`Sucesso: ${book.id}`);
    }
  }
  
  console.log('Processo finalizado.');
}

insertOab();
