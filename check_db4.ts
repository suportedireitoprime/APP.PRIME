import * as fs from 'fs';
import * as dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseKey = envConfig.VITE_SUPABASE_PUBLISHABLE_KEY?.replace(/"/g, '') || envConfig.VITE_SUPABASE_ANON_KEY?.replace(/"/g, '');
const supabaseUrl = envConfig.VITE_SUPABASE_URL?.replace(/"/g, '');

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }});
  const data = await res.json();
  console.log('simulados:', JSON.stringify(data.definitions.simulados.properties, null, 2));
  console.log('simulado_questions:', JSON.stringify(data.definitions.simulado_questions.properties, null, 2));
}
check();
