require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

supabase.rpc('execute_sql', { sql: 'ALTER TABLE public."CP_CODIGO_PENAL" ADD COLUMN IF NOT EXISTS audio_pilula_url text;' })
  .then(res => console.log('RPC result:', res))
  .catch(err => console.error('RPC error:', err));
