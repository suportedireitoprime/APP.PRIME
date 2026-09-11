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
  let updated = 0;

  while (hasMore) {
    const { data: blocos, error } = await supabase
      .from('aprender_blocos')
      .select('id, tipo, payload')
      .in('tipo', ['leitura', 'texto', 'conceito', 'intro'])
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(error);
      return;
    }

    if (blocos.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Page ${page}: Scanning ${blocos.length} text blocos...`);

    let toUpdate = [];
    for (const bloco of blocos) {
       const str = JSON.stringify(bloco.payload) || "";
       if (str.includes('FIXAÇÃO IMEDIATA') || str.includes('(A)') || str.includes('QUESTÃO')) {
          console.log(`Found candidate id=${bloco.id}, tipo=${bloco.tipo}`);
          // Let's make sure it really is a question:
          if (str.includes('(A)') && str.includes('(B)')) {
             console.log(`CONFIRMED QUESTION: ${bloco.id}`);
             toUpdate.push(bloco.id);
          }
       }
    }
    
    if (toUpdate.length > 0) {
       const { error: updErr } = await supabase.from('aprender_blocos').update({ tipo: 'pergunta' }).in('id', toUpdate);
       if (updErr) console.error("Error updating:", updErr);
       else {
          console.log("Updated " + toUpdate.length + " to pergunta.");
          updated += toUpdate.length;
       }
    }
    
    page++;
  }
  
  console.log("Total updated:", updated);
}
run();
