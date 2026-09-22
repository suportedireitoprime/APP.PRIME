import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const userId = '10242e0c-25e2-4532-9c11-c9d765dce510';
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId);
  console.log('Profile:', profile);
  
  const { data: playSubs } = await supabase.from('play_subscriptions').select('*').eq('user_id', userId);
  console.log('Play Subs:', playSubs);
}
main();
