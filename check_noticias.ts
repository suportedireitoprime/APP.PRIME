import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('noticias_feed')
    .select('id, titulo, imagem_url')
    .order('data_publicacao', { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
  } else {
    console.table(data);
  }
}
check();
