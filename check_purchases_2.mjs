import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n');
let url = '', key = '';
for (const line of env) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function main() {
  const { data } = await supabase.from('app_events').select('created_at, event_name, email').eq('event_name', 'purchase').order('created_at', { ascending: false }).limit(5);
  console.log('Recent purchases:', data);
  const { data: all } = await supabase.from('app_events').select('created_at').eq('event_name', 'purchase').order('created_at', { ascending: true }).limit(1);
  console.log('Oldest purchase:', all);
}
main();
