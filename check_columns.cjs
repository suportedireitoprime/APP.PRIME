const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase.from('concursos_noticias').select('data_publicacao').order('data_publicacao', { ascending: true }).limit(1);
  if (error) { console.error(error); return; }
  console.log(JSON.stringify(data[0], null, 2));
}
checkData();


