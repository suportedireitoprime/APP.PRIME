import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n');
let url = '', key = '';
for (const line of env) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"\r]/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim().replace(/['"\r]/g, '');
}
const sb = createClient(url, key);

async function main() {
  const { data, error } = await sb.from('users').select('*').ilike('email', '%restefane16%');
  if (error) console.error("Error:", error);
  console.log("Users:", data);
  if (data?.length > 0) {
    const { data: subs } = await sb.from('user_subscriptions').select('*').eq('user_id', data[0].id);
    console.log("Subs:", subs);
  }
}
main();
