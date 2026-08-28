import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const userId = '2516a1e7-1bfd-413b-8407-38d9c3e1e904';
  
  const tables = ['play_subscriptions', 'user_subscriptions', 'asaas_subscriptions', 'apple_subscriptions'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error(`Error fetching ${table}:`, error);
    } else {
      console.log(`\n--- ${table} (${data.length} records) ---`);
      if (data.length > 0) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
}

run();
