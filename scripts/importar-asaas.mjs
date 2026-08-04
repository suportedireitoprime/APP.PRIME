#!/usr/bin/env node
/**
 * Importa as assinaturas ATIVAS do Asaas para public.legacy_subscribers.
 *
 * Uso:
 *   ASAAS_API_KEY="$aact_prod_..." \
 *   NEW_DB_URL="postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres" \
 *   node scripts/importar-asaas.mjs [--dry-run]
 */
import postgres from 'postgres';

const KEY = process.env.ASAAS_API_KEY;
const NEW = process.env.NEW_DB_URL;
const DRY = process.argv.includes('--dry-run');
const BASE = process.env.ASAAS_BASE || 'https://api.asaas.com/v3';

if (!KEY || !NEW) {
  console.error('Defina ASAAS_API_KEY e NEW_DB_URL.');
  process.exit(1);
}

const sql = postgres(NEW, { ssl: 'require', max: 2 });
const headers = { access_token: KEY, 'Content-Type': 'application/json' };

async function getAll(path, params = {}) {
  const out = [];
  let offset = 0;
  for (;;) {
    const qs = new URLSearchParams({ ...params, limit: '100', offset: String(offset) });
    const res = await fetch(`${BASE}${path}?${qs}`, { headers });
    if (!res.ok) throw new Error(`${path} -> ${res.status} ${await res.text()}`);
    const json = await res.json();
    out.push(...(json.data ?? []));
    if (!json.hasMore) break;
    offset += 100;
  }
  return out;
}

const subs = await getAll('/subscriptions', { status: 'ACTIVE' });
console.log(`Assinaturas ativas no Asaas: ${subs.length}`);

// cache de clientes
const clientes = new Map();
for (const c of await getAll('/customers')) clientes.set(c.id, c);
console.log(`Clientes carregados: ${clientes.size}`);

let ok = 0, semEmail = 0;
for (const s of subs) {
  const c = clientes.get(s.customer);
  const email = c?.email?.trim();
  if (!email) { semEmail++; continue; }
  const expires = s.nextDueDate
    ? new Date(new Date(s.nextDueDate).getTime() + 34 * 24 * 3600 * 1000).toISOString()
    : null;
  if (DRY) { ok++; continue; }
  await sql`
    insert into public.legacy_subscribers
      (email, nome, tipo, asaas_customer_id, asaas_subscription_id, expires_at, status, observacao)
    values (${email}, ${c.name || null}, 'mensal', ${s.customer}, ${s.id}, ${expires}, 'active', 'importado do Asaas')
    on conflict (lower(email)) do update
      set tipo = 'mensal',
          nome = coalesce(excluded.nome, public.legacy_subscribers.nome),
          asaas_customer_id = excluded.asaas_customer_id,
          asaas_subscription_id = excluded.asaas_subscription_id,
          expires_at = excluded.expires_at,
          status = 'active'
  `;
  ok++;
}

console.log(`${DRY ? '[dry-run] ' : ''}Assinantes gravados: ${ok} | sem e-mail: ${semEmail}`);
await sql.end();
