import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// For schema querying we might need service_role, let's see if it's there or just query through REST if policies allow, but typically we need service role.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, serviceKey);

async function check() {
  // Get all table names
  const { data: allTables, error: queryError } = await supabase.rpc('get_all_tables_not_exists');
  // fallback if rpc not defined
  const { data: schemaTables } = await supabase.from('pilulas_decks').select('*').limit(0);

  const dropScript = `
    DROP TABLE IF EXISTS public.pilulas_cards CASCADE;
    DROP TABLE IF EXISTS public.pilulas_decks CASCADE;
  `;
  
  // Since we don't have direct SQL exec via REST without an RPC, let's just use REST delete? No, we want to DROP the tables.
  // Actually, dropping tables requires postgres access. I can use psql if we have the connection string.
  // Is there a connection string in .env? Let's print the env variables.
  console.log('Env URL:', supabaseUrl);

}

check();
