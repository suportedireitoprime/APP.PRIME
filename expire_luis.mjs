import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'conceicaoluisaugusto5@gmail.com';
  
  // Find user by email via admin API
  const { data: { users }, error: err1 } = await supabase.auth.admin.listUsers();
    
  if (err1) {
    console.error("Error finding users:", err1);
    return;
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    console.log("No auth user found for email:", email);
    return;
  }
  
  const userId = user.id;
  console.log("Found user ID:", userId);
  
  // Update trial record to expired
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: sub, error: err2 } = await supabase
    .from('user_subscriptions')
    .update({ 
      expires_at: yesterday,
      status: 'expired'
    })
    .eq('user_id', userId)
    .select();
    
  if (err2) {
    console.error("Error updating subscription:", err2);
    return;
  }
  
  if (!sub || sub.length === 0) {
     console.log("No subscription found, perhaps they haven't started a trial or it's in another table.");
     // Try to insert an expired one? Let's check what records exist for this user in user_subscriptions
     const { data: subs } = await supabase.from('user_subscriptions').select('*').eq('user_id', userId);
     console.log("Existing subs:", subs);
  } else {
     console.log("Subscription updated successfully:", sub);
  }
}

main();
