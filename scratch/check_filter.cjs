const { createClient } = require('@supabase/supabase-js');

const sbAdmin = createClient(
  'https://dnjrgpldcwcpoywamorr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w'
);
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

async function testFilter() {
  const leandroId = 'dcc26886-5e48-46ac-bd77-5bd539df549b';
  const { data: link } = await sbAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: 'leandrofs2010@gmail.com'
  });
  const userClient = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', SUPABASE_PUBLISHABLE_KEY);
  await userClient.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink'
  });

  const graceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  console.log('graceIso:', graceIso);
  const resWithFilter = await userClient.from('asaas_subscriptions')
    .select('plano, status, expires_at, started_at')
    .eq('user_id', leandroId)
    .in('status', ['ACTIVE', 'ACTIVE_GRACE'])
    .or(`expires_at.is.null,expires_at.gt.${graceIso}`)
    .limit(1)
    .maybeSingle();

  console.log('resWithFilter:', resWithFilter);
}

testFilter().catch(console.error);
