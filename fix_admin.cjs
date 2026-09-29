const fs = require('fs');
const path = require('path');
const file = path.join('src', 'components', 'admin', 'AdminHojeCards.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const ADMIN_EMAILS = \['wn7corporation@gmail\.com', 'suporte@direitoprime\.com\.br', 'wn7juridico@gmail\.com'\];/,
  "const ADMIN_EMAILS = ['wn7corporation@gmail.com', 'suporte@direitoprime.com.br', 'wn7juridico@gmail.com', 'reisecomerc@gmail.com'];"
);

// We also need to fix fetchMetrics to only count ACTIVE and ignore admin emails.
// Wait, asaas_subscriptions doesn't have email in fetchMetrics. 
// We will just filter by ACTIVE status for all queries, and manually exclude M Ferreira's user_id 'c50d4d1d-c7c5-44e7-bab1-5116779d9a17'
const UID_MFERREIRA = 'c50d4d1d-c7c5-44e7-bab1-5116779d9a17';

content = content.replace(
  /const subUsers = new Map<string, { plano: string; valor: number }>\(\);\s*\(asaasRes\.data \|\| \[\]\)\.forEach\(\(s: any\) => {/g,
  const subUsers = new Map<string, { plano: string; valor: number }>();\n\n        (asaasRes.data || []).forEach((s: any) => {\n          if (s.status !== 'ACTIVE' && s.status !== 'ACTIVE_GRACE' && s.status !== 'active') return;\n          if (s.user_id === '' || s.id === '') return;
);

content = content.replace(
  /\(playRes\.data \|\| \[\]\)\.forEach\(\(s: any\) => {/g,
  (playRes.data || []).forEach((s: any) => {\n          if (s.status !== 'ACTIVE' && s.status !== 'ACTIVE_GRACE' && s.status !== 'active') return;\n          if (s.user_id === '' || s.id === '') return;
);

content = content.replace(
  /\(appleRes\.data \|\| \[\]\)\.forEach\(\(s: any\) => {/g,
  (appleRes.data || []).forEach((s: any) => {\n          if (s.status !== 'ACTIVE' && s.status !== 'ACTIVE_GRACE' && s.status !== 'active') return;\n          if (s.user_id === '' || s.id === '') return;
);

content = content.replace(
  /\(legRes\.data \|\| \[\]\)\.forEach\(\(s: any\) => {/g,
  (legRes.data || []).forEach((s: any) => {\n          if (s.status !== 'ACTIVE' && s.status !== 'ACTIVE_GRACE' && s.status !== 'active') return;\n          if (s.claimed_user_id === '' || s.id === '') return;
);

fs.writeFileSync(file, content);
console.log('Fixed ADMIN_EMAILS and status filters');
