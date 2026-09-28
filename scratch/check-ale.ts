import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing credentials");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (pErr) return console.error(pErr);
  
  for (const p of profiles) {
    const { data: { user }, error: uErr } = await supabase.auth.admin.getUserById(p.id);
    if (user && user.email?.includes('ale.dosan')) {
      console.log("FOUND RECENT USER!", user.email, user.user_metadata);
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', p.id).single();
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', p.id).single();
      console.log("Premium:", prof?.is_premium);
      console.log("Subscription:", sub);
      return;
    }
  }
  
  console.log("User not found in recent 100 profiles");
}

checkUser();
