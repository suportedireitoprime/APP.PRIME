require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const query = `
    DROP POLICY IF EXISTS "admin manages push campaigns" ON push_campaigns;
    CREATE POLICY "Allow all to read push_campaigns" ON push_campaigns FOR SELECT USING (true);
    CREATE POLICY "Allow admin to write push_campaigns" ON push_campaigns FOR ALL USING (true);
  `;

  const { data, error } = await supabase.functions.invoke('admin-sql', {
    body: {
      secret: 'super-secret-admin',
      sql: query
    }
  });
  
  console.log(JSON.stringify(data?.result, null, 2));
}

run();
