import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const emails = [
  'jeany.cardoso1986@gmail.com',
  'fernandahelenfhs@gmail.com',
  'pablo.peroni.cr@icloud.com',
  'jullieprincessdj@gmail.com',
  'franciscoasouza6@gmail.com',
  'ale.dosan.449@gmail.com',
  'michelegabriel157@gmail.com',
  'olga.santos@pucpr.edu.br',
  'souzacelio85@hotmail.com',
  'cristiafaust@gmail.com',
  'eduupmachado0108@gmail.com',
  'karolayneddantas@gmail.com',
  'wn7corpooration@gmail.com',
  'amandinhaas2j@gmail.com',
  'jonasaimone16@gmail.com',
  'santosleonardox@gmail.com',
  'britoiasmin0710@gmail.com',
  'dayy.blessed@gmail.com',
  'fribeiro706@yahoo.com',
  'cauev9358@gmail.com',
  'rodrigohenry1707@gmail.com',
  'luantenorio2@gmail.com',
  'eduardofrsilva8522@gmail.com',
  'brunomendes242975@gmail.com',
  'wn7corporation@gmail.com',
  'rrafael716@outlook.com',
  'lohanna.costa@gmail.com',
  'marlon.lxpower@gmail.com',
  'adrianodavel@souunisuam.com.br',
  'felipeborato616@gmail.com',
  'thavieira.k7@gmail.com',
  'camilladudabinho@gmail.com'
];

async function run() {
  const { data: { users: authUsersList } } = await supabase.auth.admin.listUsers({ perPage: 10000 });
  const authUserMap = new Map();
  authUsersList?.forEach(u => {
    if (u.email) authUserMap.set(u.email.toLowerCase().trim(), u);
  });

  const { data: profiles } = await supabase.from('profiles').select('id, display_name, created_at');
  const profileMap = new Map();
  profiles?.forEach(p => profileMap.set(p.id, p));

  const { data: activityLogs } = await supabase.from('user_activity_log').select('user_id, email, last_seen_at');
  const actMapByUserId = new Map();
  const actMapByEmail = new Map();
  activityLogs?.forEach(a => {
    if (a.user_id) actMapByUserId.set(a.user_id, a.last_seen_at);
    if (a.email) actMapByEmail.set(a.email.toLowerCase().trim(), a.last_seen_at);
  });

  const getLatest = (...dates) => {
    let best = 0;
    let bestStr = null;
    for (const d of dates) {
      if (!d) continue;
      const t = new Date(d).getTime();
      if (!isNaN(t) && t > best) {
        best = t;
        bestStr = d;
      }
    }
    return bestStr;
  };

  const results = [];

  for (const email of emails) {
    const cleanEmail = email.toLowerCase().trim();
    const authU = authUserMap.get(cleanEmail);
    const userId = authU?.id;
    const profile = userId ? profileMap.get(userId) : null;
    const actDate = (userId ? actMapByUserId.get(userId) : null) || actMapByEmail.get(cleanEmail);

    let latestEventDate = null;
    let latestSessionDate = null;

    if (userId) {
      const { data: lastEvent } = await supabase
        .from('app_events')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      latestEventDate = lastEvent?.created_at || null;

      const { data: lastSession } = await supabase
        .from('user_sessions')
        .select('started_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      latestSessionDate = lastSession?.started_at || null;
    }

    const lastAccessIso = getLatest(
      actDate,
      latestEventDate,
      latestSessionDate,
      authU?.last_sign_in_at,
      authU?.created_at,
      profile?.created_at
    );

    const formatDt = (iso) => {
      if (!iso) return 'Sem registro no App (somente Asaas)';
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    };

    results.push({
      email: cleanEmail,
      userId: userId || null,
      cadastradoNoApp: !!authU,
      ultimoAcessoIso: lastAccessIso,
      ultimoAcessoFormatado: formatDt(lastAccessIso)
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

run();
