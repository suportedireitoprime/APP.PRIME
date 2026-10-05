const url = 'https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/admin-sql';
const query = `
    ALTER TABLE public.vade_mecum_leis ADD COLUMN IF NOT EXISTS sobre_html TEXT;
`;
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sql: query, secret: 'super-secret-admin' })
}).then(res => res.json()).then(console.log).catch(console.error);
