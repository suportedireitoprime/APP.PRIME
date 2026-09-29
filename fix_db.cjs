async function run() {
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
  const res = await fetch('https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/admin-sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: 'super-secret-admin', sql })
  });
  const data = await res.json();
  console.log(data);
}
run();
