require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixAdminFunction() {
  const sql = `
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
      AND lower(email) IN (
        'wn7corporation@gmail.com',
        'suporte@direitoprime.com.br',
        'wn7juridico@gmail.com',
        'wn7wjridico@gmail.com',
        'reisecomerc@gmail.com'
      )
  );
$$;
  `;
  
  const { data, error } = await supabase.functions.invoke('admin-sql', {
    body: { sql: sql, secret: 'super-secret-admin' }
  });
  
  if (error) console.error(error);
  else console.log('Fixed!', data);
}

fixAdminFunction();
