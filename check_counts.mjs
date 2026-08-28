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
  const { count: total } = await supabase.from('app_events').select('*', { count: 'exact', head: true }).eq('event_name', 'purchase');
  
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recent } = await supabase.from('app_events').select('*', { count: 'exact', head: true }).eq('event_name', 'purchase').gte('created_at', yesterday);

  console.log('Total purchases in app_events:', total);
  console.log('Recent purchases (last 24h) in app_events:', recent);
}
main();
