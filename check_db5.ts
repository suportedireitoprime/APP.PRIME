import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseKey = envConfig.VITE_SUPABASE_PUBLISHABLE_KEY?.replace(/"/g, '') || envConfig.VITE_SUPABASE_ANON_KEY?.replace(/"/g, '');
const supabaseUrl = envConfig.VITE_SUPABASE_URL?.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const res = await supabase.from('simulados').insert({ exam_id: '123e4567-e89b-12d3-a456-426614174000', year: 2025, edition: 'Exame 3' }).select();
  console.log(res.error);
}
check();
