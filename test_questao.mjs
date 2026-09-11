import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('aprender_blocos').select('id, tipo, payload').eq('tipo', 'pergunta').limit(10);
  if (error) console.error(error);
  
  if (data && data.length > 0) {
    console.log('Found ' + data.length + ' blocos with tipo = pergunta');
    console.log(JSON.stringify(data[0].payload, null, 2));
  } else {
    console.log("None found");
  }
}
run();
