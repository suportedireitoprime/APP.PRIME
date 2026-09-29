import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const userId = '95fedf80-c9ee-44c5-a118-1bcbee48e21f';
  
  // Make created_at 4 days old
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      created_at: fourDaysAgo,
      onboarding_completed_at: fourDaysAgo
    })
    .eq('id', userId)
    .select();
    
  if (error) {
    console.error("Error updating profile:", error);
  } else {
    console.log("Profile updated successfully, trial should be expired:", data);
  }
}

main();
