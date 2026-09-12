import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envData = fs.readFileSync('.env', 'utf8');
const env = envData.split(/\r?\n/).reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) {
    acc[k.trim()] = v.join('=').trim().replace(/`/g, '').replace(/"/g, '');
  }
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: blocos } = await supabase
    .from('aprender_blocos')
    .select('payload')
    .eq('aula_id', '6d8a97a6-bb52-4e19-adee-901910f0d1f7')
    .order('ordem');
  
  if (!blocos) return;
  
  const text = blocos.map(b => b.payload.texto || b.payload.frente || b.payload.rawContent || '').filter(Boolean).join('\n\n');
  fs.writeFileSync('sujeitos_resumo.txt', text);
  console.log("Resumo extracted.");
}

run();
