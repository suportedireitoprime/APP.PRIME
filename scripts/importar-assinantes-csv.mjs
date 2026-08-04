#!/usr/bin/env node
/**
 * Importa a lista de assinantes premium do app antigo para public.legacy_subscribers.
 *
 * Aceita um CSV com cabeçalho (colunas em qualquer ordem):
 *   email,nome,tipo,asaas_customer_id,asaas_subscription_id,expires_at
 * tipo = "vitalicio" ou "mensal" (padrão: mensal)
 *
 * Uso:
 *   NEW_DB_URL="postgresql://postgres:SENHA@db.dnjrgpldcwcpoywamorr.supabase.co:5432/postgres" \
 *   node scripts/importar-assinantes-csv.mjs assinantes.csv
 */
import fs from 'node:fs';
import postgres from 'postgres';

const [file] = process.argv.slice(2);
const NEW = process.env.NEW_DB_URL;
if (!file || !NEW) {
  console.error('Uso: NEW_DB_URL=... node scripts/importar-assinantes-csv.mjs arquivo.csv');
  process.exit(1);
}

const linhas = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
const head = linhas.shift().split(',').map((h) => h.trim().toLowerCase());
const sql = postgres(NEW, { ssl: 'require', max: 2 });

let ok = 0;
for (const linha of linhas) {
  const cols = linha.split(',');
  const row = {};
  head.forEach((h, i) => { row[h] = (cols[i] ?? '').trim(); });
  if (!row.email) continue;
  const tipo = row.tipo?.toLowerCase().startsWith('vital') ? 'vitalicio' : 'mensal';
  await sql`
    insert into public.legacy_subscribers
      (email, nome, tipo, asaas_customer_id, asaas_subscription_id, expires_at, status)
    values (
      ${row.email}, ${row.nome || null}, ${tipo},
      ${row.asaas_customer_id || null}, ${row.asaas_subscription_id || null},
      ${tipo === 'vitalicio' ? null : (row.expires_at || null)}, 'active'
    )
    on conflict (lower(email)) do update
      set tipo = excluded.tipo,
          nome = coalesce(excluded.nome, public.legacy_subscribers.nome),
          asaas_customer_id = coalesce(excluded.asaas_customer_id, public.legacy_subscribers.asaas_customer_id),
          asaas_subscription_id = coalesce(excluded.asaas_subscription_id, public.legacy_subscribers.asaas_subscription_id),
          expires_at = excluded.expires_at,
          status = 'active'
  `;
  ok++;
}
console.log(`Assinantes importados/atualizados: ${ok}`);
await sql.end();
