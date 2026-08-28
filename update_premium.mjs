import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const userId = '2516a1e7-1bfd-413b-8407-38d9c3e1e904';
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', userId)
    .select();
    
  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Profile updated successfully to is_premium: true');
  }
}

run();
