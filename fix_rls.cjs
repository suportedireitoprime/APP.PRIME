require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.functions.invoke('admin-sql', {
    body: {
      secret: 'super-secret-admin',
      sql: 'CREATE POLICY "Allow admins to read push_events" ON push_events FOR SELECT USING (true);'
    }
  });
  console.log('Data:', data);
  console.log('Error:', error);
}
run();
