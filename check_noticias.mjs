import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('noticias_juridicas')
    .select('id, titulo, imagem_url')
    .ilike('titulo', '%STJ: EX NÃO DEVE ALUGUEL%')
    .limit(1);

  if (error) {
    console.error(error);
  } else {
    console.dir(data, { depth: null });
  }
}
check();
