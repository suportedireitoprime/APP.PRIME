require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  const sql = `
  SELECT id, email, public.is_admin_user(id) as is_admin 
  FROM auth.users 
  WHERE email ILIKE '%wn7corporation@gmail.com%';
  `;
  
  const { data, error } = await supabase.functions.invoke('admin-sql', {
    body: { sql: sql, secret: 'super-secret-admin' }
  });
  
  console.log('User check:', JSON.stringify(data, null, 2), error);
}

runTest();
