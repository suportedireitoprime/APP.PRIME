require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const query = `
    SELECT
      t.tablename,
      (
        SELECT count(*)
        FROM pg_policies p
        WHERE p.tablename = t.tablename
      ) as policy_count,
      t.rowsecurity
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    ORDER BY policy_count ASC;
  `;

  const { data, error } = await supabase.functions.invoke('admin-sql', {
    body: {
      secret: 'super-secret-admin',
      sql: query
    }
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const tablesWithoutRLS = data.result.filter(t => t.policy_count == 0);
  console.log('Tables with 0 policies:');
  console.log(JSON.stringify(tablesWithoutRLS, null, 2));
}

run();
