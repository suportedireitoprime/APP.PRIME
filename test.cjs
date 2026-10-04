require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);
async function run() {
  const { data, error } = await supabase.from('simulados').select('id, exam:simulado_exams(name)').limit(1);
  if (data && data.length) {
    console.log('simulado id:', data[0].id);
    const { data: q } = await supabase.from('questoes_simulado_itens').select('*').eq('simulado_id', data[0].id).limit(1);
    console.log('questoes_simulado_itens:', q);
  }
}
run();
