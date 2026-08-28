import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Fetching users who have active subscriptions but are not premium...');
  
  // Get all active user_subscriptions
  const { data: activeSubs, error: subsError } = await supabase
    .from('user_subscriptions')
    .select('user_id, status')
    .eq('status', 'active');
    
  if (subsError) {
    console.error('Error fetching subscriptions:', subsError);
    return;
  }
  
  const activeUserIds = [...new Set(activeSubs.map(s => s.user_id))];
  console.log(`Found ${activeUserIds.length} users with active subscriptions.`);
  
  // Find which ones have is_premium = false
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, is_premium')
    .in('id', activeUserIds)
    .eq('is_premium', false);
    
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }
  
  console.log(`Found ${profiles.length} users who need to be upgraded.`);
  
  if (profiles.length > 0) {
    const idsToUpdate = profiles.map(p => p.id);
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .in('id', idsToUpdate)
      .select('id');
      
    if (updateError) {
      console.error('Error updating profiles:', updateError);
    } else {
      console.log(`Successfully updated ${updated.length} users to is_premium = true.`);
    }
  }
}

run();
