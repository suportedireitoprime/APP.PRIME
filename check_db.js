import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '...'; // I will get it from .env

// Wait, I can just read .env
import fs from 'fs';
import dotenv from 'dotenv';
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: cols, error } = await supabase.rpc('get_simulados_schema'); // This might not exist
  // Let's just fetch one row to see columns
  const res1 = await supabase.from('simulados').select('*').limit(1);
  console.log('simulados columns:', res1.data ? Object.keys(res1.data[0] || {}) : res1.error);
  
  const res2 = await supabase.from('simulado_questions').select('*').limit(1);
  console.log('simulado_questions columns:', res2.data ? Object.keys(res2.data[0] || {}) : res2.error);
}

check();
