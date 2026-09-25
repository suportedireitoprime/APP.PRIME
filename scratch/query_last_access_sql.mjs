import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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
  const emailListSql = emails.map(e => `'${e.toLowerCase()}'`).join(',');

  const sql = `
    SELECT 
      lower(u.email) as email,
      u.id,
      p.display_name,
      u.created_at as created_at,
      u.last_sign_in_at as last_sign_in_at,
      a.last_seen_at as act_last_seen_at,
      (SELECT MAX(created_at) FROM public.app_events ev WHERE ev.user_id = u.id) as last_event_at,
      (SELECT MAX(started_at) FROM public.user_sessions sess WHERE sess.user_id = u.id) as last_session_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.user_activity_log a ON a.user_id = u.id
    WHERE lower(u.email) IN (${emailListSql});
  `;

  const { data, error } = await supabase.functions.invoke('admin-sql', {
    body: { sql, secret: 'super-secret-admin' }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const rows = data?.result || [];
  const rowMap = new Map();
  rows.forEach(r => rowMap.set(r.email, r));

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

  const finalOutput = emails.map(e => {
    const row = rowMap.get(e.toLowerCase());
    if (!row) {
      return {
        email: e,
        cadastrado: false,
        ultimo_acesso: 'Nunca acessou o App (assinou no Asaas e não criou conta no App)'
      };
    }

    const latest = getLatest(
      row.act_last_seen_at,
      row.last_event_at,
      row.last_session_at,
      row.last_sign_in_at,
      row.created_at
    );

    const formatted = latest 
      ? new Date(latest).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : 'Sem data';

    return {
      email: e,
      nome: row.display_name || 'Sem nome',
      cadastrado: true,
      ultimo_acesso: formatted,
      data_iso: latest
    };
  });

  console.log(JSON.stringify(finalOutput, null, 2));
}

run();
