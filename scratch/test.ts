import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

async function main() {
  const { data, error } = await supabase.rpc('admin_metricas_dia', { _dia: new Date().toISOString().split('T')[0] });
  console.log('Metrics:', data);
  if (error) console.error('Error:', error);
}

main();
