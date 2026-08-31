require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  const { data } = await supabase
    .from('biblioteca_classicos')
    .select('id, livro, imagem')
    .limit(3);

  for (const r of data) {
    console.log(`\n${r.livro}`);
    console.log(`  URL: ${r.imagem}`);
    try {
      const resp = await fetch(r.imagem);
      console.log(`  HTTP status: ${resp.status}`);
      const contentType = resp.headers.get('content-type');
      console.log(`  Content-Type: ${contentType}`);
    } catch (e) {
      console.log(`  ERRO: ${e.message}`);
    }
  }
}

test();
