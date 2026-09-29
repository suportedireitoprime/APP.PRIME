import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAccount() {
  const email = 'conceicaoluisaugusto5@gmail.com';
  
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  const targetUser = users.users.find(u => u.email === email);
  if (!targetUser) return;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUser.id)
    .single();
    
  console.log('Profile columns:', Object.keys(data));
  console.log('Profile data:', data);
}

checkAccount();
