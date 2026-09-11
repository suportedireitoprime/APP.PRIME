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
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;
  let count = 0;

  while (hasMore) {
    const { data: all, error: eAll } = await supabase.from('aprender_blocos')
      .select('id, tipo, payload')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (eAll) {
      console.error(eAll);
      break;
    }
    
    if (all.length === 0) {
      hasMore = false;
      break;
    }
    
    console.log(`Page ${page}: Scanning ${all.length} blocos...`);
    
    for (const b of all || []) {
      const s = JSON.stringify(b.payload);
      if (s.includes('QUESTÃO PRÁTICA') || s.includes('FIXAÇÃO IMEDIATA') || s.includes('(A) ')) {
        // Double check it's actually a question
        if (s.includes('(A) ') && s.includes('(B) ')) {
           console.log(`Found question: id=${b.id}, tipo=${b.tipo}`);
           count++;
           if (b.tipo !== 'pergunta') {
              await supabase.from('aprender_blocos').update({tipo: 'pergunta'}).eq('id', b.id);
              console.log("Updated to pergunta!");
           }
        }
      }
    }
    page++;
  }
  
  console.log("Local scan done, total questions updated/found:", count);
}
run();
