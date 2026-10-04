import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseKey = envConfig.VITE_SUPABASE_PUBLISHABLE_KEY?.replace(/"/g, '') || envConfig.VITE_SUPABASE_ANON_KEY?.replace(/"/g, '');
const supabaseUrl = envConfig.VITE_SUPABASE_URL?.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const res1 = await supabase.from('simulados').select('*').limit(1);
  console.log('simulados columns:', res1.data ? Object.keys(res1.data[0] || {}) : res1.error);
  
  const res2 = await supabase.from('simulado_questions').select('*').limit(1);
  console.log('simulado_questions columns:', res2.data ? Object.keys(res2.data[0] || {}) : res2.error);
}
check();
