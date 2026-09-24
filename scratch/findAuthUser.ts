import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

async function run() {
  // List all users from auth.users via admin
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  console.log("Total auth users:", users?.length, "Auth error:", authErr);
  
  const isa = users?.filter(u => 
    u.email?.toLowerCase().includes('isabelle') || 
    u.email?.toLowerCase().includes('severo') ||
    u.phone?.includes('5197563340') ||
    u.user_metadata?.name?.toLowerCase().includes('isabelle') ||
    u.user_metadata?.full_name?.toLowerCase().includes('isabelle')
  );
  console.log("Usuários encontrados no auth:", JSON.stringify(isa, null, 2));

  // Check all tables in public schema related to subscriptions
  const { data: tables, error: tErr } = await supabase.rpc('get_tables_or_similar').catch(() => ({ data: null }));
}
run();
