import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("VITE_SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

async function run() {
  const { data: convos } = await supabase.from('horus_conversations').select('phone_e164, role, content, created_at').order('created_at', { ascending: false }).limit(300);
  
  if (!convos || convos.length === 0) { console.log('No conversations found.'); return; }
  const uniquePhones = [...new Set(convos.map(c => c.phone_e164))];
  
  // Find which ones are premium by checking horus_whatsapp_users or profiles?
  let profiles = [];
  const chunkSize = 20;
  for (let i = 0; i < uniquePhones.length; i += chunkSize) {
    const chunk = uniquePhones.slice(i, i + chunkSize);
    const phoneFilter = chunk.map(p => `telefone.ilike.%${p}%`).join(',');
    if (phoneFilter) {
       const { data } = await supabase.from('profiles').select('telefone, whatsapp_number, is_premium').or(phoneFilter);
       if (data) profiles.push(...data);
    }
  }
  
  const premiumProfiles = profiles.filter(p => p.is_premium);
  console.log('Found', uniquePhones.length, 'unique phones in last 300 messages');
  console.log('Profiles with these phones:', premiumProfiles.length, 'premium profiles found');
  
  // Match phones to premium profiles
  const premiumPhones = uniquePhones.filter(phone => {
    return premiumProfiles.some(p => {
      const pTel = (p.telefone || '').replace(/\D/g, '');
      const pWa = (p.whatsapp_number || '').replace(/\D/g, '');
      const tPhone = phone.replace(/\D/g, '');
      return pTel.includes(tPhone) || tPhone.includes(pTel) || pWa.includes(tPhone) || tPhone.includes(pWa);
    });
  });

  console.log('Premium Phones found:', premiumPhones);

  for (const p of premiumPhones) {
    const userConvos = convos.filter(c => c.phone_e164 === p);
    console.log('\n--- Premium Phone: ' + p + ' ---');
    for (const c of userConvos.reverse()) {
      console.log('[' + c.role + '] (' + c.created_at + '): ' + c.content.substring(0, 100).replace(/\n/g, ' '));
    }
  }

  // Also check outbound logs for errors for these phones
  for (const p of premiumPhones) {
    const { data: logs } = await supabase.from('horus_outbound_log').select('status, error, created_at').eq('phone_e164', p).eq('status', 'failed').order('created_at', { ascending: false }).limit(5);
    if (logs && logs.length > 0) {
      console.log('\n--- Errors for Premium Phone: ' + p + ' ---');
      console.log(logs);
    }
  }
}
run();
