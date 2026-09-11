const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: blocos, error } = await supabase
    .from('aprender_blocos')
    .select('id, tipo, ordem, payload')
    .ilike('payload->>conteudo', '%Matriz de Aprendizagem%')
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(blocos, null, 2));
}
run().catch(console.error);
