import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase.from('play_subscriptions').select('base_plan_id, id').limit(10);
  console.log(data, error);
}

main();
