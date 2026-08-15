import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('questoes').select('assunto');
  if (error) {
    console.error(error);
    return;
  }
  const counts = {};
  data.forEach(d => {
    let a = d.assunto;
    if (!a) return;
    counts[a] = (counts[a] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  console.log("Total unique assuntos:", sorted.length);
  console.log("Top 30:");
  console.log(sorted.slice(0, 30));
  
  // Find those with ">"
  const withArrow = sorted.filter(s => s[0].includes('>'));
  console.log("With arrow count:", withArrow.length);
  console.log("Samples:", withArrow.slice(0, 10));
}
run();
