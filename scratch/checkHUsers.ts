import { createClient } from '@supabase/supabase-js';

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(url, key);

const USER_ID = '38b22d80-1a64-4504-9523-2ebd1b38948d';

async function run() {
  const { data: rows } = await supabase
    .from('horus_whatsapp_users')
    .select('*')
    .or(`user_id.eq.${USER_ID},linked_user_id.eq.${USER_ID},phone_e164.ilike.%97563340%`);
  console.log("Horus WhatsApp rows for Isabelle:", JSON.stringify(rows, null, 2));
}
run();
