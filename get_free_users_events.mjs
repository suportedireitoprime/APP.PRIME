import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Fetching top events for free users in the last 7 days...');
  
  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateString = sevenDaysAgo.toISOString();

  // 1. Fetch free users
  const { data: freeProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_premium', false);
    
  if (profilesError) {
    console.error('Error fetching free profiles:', profilesError);
    return;
  }
  
  const freeUserIds = freeProfiles.map(p => p.id);
  console.log(`Found ${freeUserIds.length} free users.`);
  
  // 2. Fetch events in the last 7 days for these users
  // Note: doing this in batches if there are many users/events, or we can just fetch all events in last 7 days and filter.
  // Let's fetch events in the last 7 days first.
  const { data: events, error: eventsError } = await supabase
    .from('app_events')
    .select('event_name, user_id')
    .gte('created_at', dateString);
    
  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    return;
  }
  
  console.log(`Found ${events.length} total events in the last 7 days.`);
  
  // Filter for free users
  const freeUserSet = new Set(freeUserIds);
  const freeEvents = events.filter(e => e.user_id && freeUserSet.has(e.user_id));
  
  console.log(`Found ${freeEvents.length} events by free users.`);
  
  // Count by event_name
  const counts = {};
  for (const e of freeEvents) {
    counts[e.event_name] = (counts[e.event_name] || 0) + 1;
  }
  
  // Sort and print top 20
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
  
  console.log('\n--- Top 20 functions/events by free users (Last 7 days) ---');
  sorted.forEach(([name, count], i) => {
    console.log(`${i + 1}. ${name} (${count} acessos)`);
  });
}

run();
