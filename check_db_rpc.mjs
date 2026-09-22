import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supa = createClient(url, key);

async function run() {
  const { data, error } = await supa.rpc('execute_sql', { query: `
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'admin_lista_dia';
  ` });
  console.log("Function Def:", data?.[0]?.pg_get_functiondef);
}

run().catch(console.error);
