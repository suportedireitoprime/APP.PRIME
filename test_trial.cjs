require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('play_subscriptions').select('*').order('created_at', {ascending: false}).limit(10).then(({data, error}) => console.log(error || data));
