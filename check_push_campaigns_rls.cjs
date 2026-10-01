require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const query = `
    SELECT tablename, policyname
    FROM pg_policies
    WHERE tablename = 'push_campaigns';
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
