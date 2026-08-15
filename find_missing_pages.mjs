import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);

const tables = [
  { table: 'biblioteca_estudos', titleField: 'tema' },
  { table: 'biblioteca_classicos', titleField: 'livro' },
  { table: 'biblioteca_oab', titleField: 'tema' },
  { table: 'biblioteca_lideranca', titleField: 'livro' },
  { table: 'biblioteca_oratoria', titleField: 'livro' },
];

async function run() {
  for (const { table, titleField } of tables) {
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${titleField}, paginas, minutos_leitura`);

    if (error) {
      console.log(`Erro em ${table}:`, error.message);
      continue;
    }

    const missing = data?.filter(book => !book.paginas || !book.minutos_leitura);
    
    if (missing && missing.length > 0) {
      console.log(`\nTabela: ${table}`);
      missing.forEach(book => {
        console.log(`- ID: ${book.id} | Titulo: ${book[titleField]} | Paginas: ${book.paginas} | Minutos: ${book.minutos_leitura}`);
      });
    } else {
      console.log(`\nTabela: ${table} - Todos os livros tem paginas e minutos_leitura.`);
    }
  }
}

run();
