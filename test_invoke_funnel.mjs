import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'YOUR_URL';
const supabaseKey = 'YOUR_KEY';

import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const lines = envFile.split('\n');
let url = '', key = '';
for (const line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.functions.invoke('play-billing', {
    body: { fn: 'funnel', days: 1 }
  });
  console.log(data.funnel.length, error);
}
main();
