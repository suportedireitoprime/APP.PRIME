import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function expireAccount() {
  const email = 'conceicaoluisaugusto5@gmail.com';
  
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const targetUser = users.users.find(u => u.email === email);
  if (!targetUser) return;
  
  const pastDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase.auth.admin.updateUserById(targetUser.id, {
    user_metadata: {
      ...targetUser.user_metadata,
      trial_ends_at: pastDate
    }
  });
  
  if (error) {
    console.error('Error updating user auth:', error);
  } else {
    console.log('User metadata updated successfully, trial_ends_at:', data.user.user_metadata.trial_ends_at);
  }
}

expireAccount();
