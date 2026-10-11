import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  if (k) env[k] = v;
});

const url = env.VITE_SUPABASE_URL || 'https://dnjrgpldcwcpoywamorr.supabase.co';
const key = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const client = createClient(url, key);

async function check() {
  const emails = ['leandrofs2010@gmail.com', 'limadesouzawagner0@gmail.com'];
  for (const email of emails) {
    console.log('====================================');
    console.log('VERIFICANDO EMAIL:', email);
    console.log('====================================');
    const { data: profiles, error: pErr } = await client.from('profiles').select('*').ilike('email', email);
    console.log('profiles:', profiles, pErr);
    const userId = profiles?.[0]?.id;
    if (userId) {
      const { data: play } = await client.from('play_subscriptions').select('*').eq('user_id', userId);
      console.log('play_subscriptions:', play);
      const { data: apple } = await client.from('apple_subscriptions').select('*').eq('user_id', userId);
      console.log('apple_subscriptions:', apple);
      const { data: asaas } = await client.from('asaas_subscriptions').select('*').eq('user_id', userId);
      console.log('asaas_subscriptions:', asaas);
      const { data: legacy } = await client.from('legacy_subscribers').select('*').or(`claimed_user_id.eq.${userId},email.ilike.${email}`);
      console.log('legacy_subscribers:', legacy);
      const { data: cancel } = await client.from('assinatura_cancelamentos').select('*').eq('user_id', userId);
      console.log('assinatura_cancelamentos:', cancel);
      const { data: events } = await client.from('app_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
      console.log('app_events:', events);
    }
  }
}

check().catch(console.error);
