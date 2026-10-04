import * as fs from 'fs';
import * as dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseKey = envConfig.VITE_SUPABASE_PUBLISHABLE_KEY?.replace(/"/g, '') || envConfig.VITE_SUPABASE_ANON_KEY?.replace(/"/g, '');
const supabaseUrl = envConfig.VITE_SUPABASE_URL?.replace(/"/g, '');

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/simulados?limit=1`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }});
  const data = await res.json();
  console.log(data);
  const res2 = await fetch(`${supabaseUrl}/rest/v1/simulado_questions?limit=1`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }});
  const data2 = await res2.json();
  console.log(data2);
}
check();
