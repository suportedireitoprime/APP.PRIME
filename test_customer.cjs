require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

s.from('asaas_subscriptions')
  .select('id, asaas_customer_id, asaas_subscription_id, user_id')
  .eq('asaas_customer_id', 'cus_000200390674')
  .then(async (r) => {
    console.log('ASAAS_CUSTOMER:', JSON.stringify(r.data, null, 2));
    
    // Check profiles for these user_ids
    for (let row of r.data) {
        const { data: p } = await s.from('profiles').select('email, display_name').eq('id', row.user_id).single();
        console.log("PROFILE:", row.user_id, p);
    }
    process.exit(0);
  });
