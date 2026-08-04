#!/usr/bin/env node
/**
 * Migração de usuários do Supabase ANTIGO para o novo projeto.
 *
 * Copia auth.users (mantendo o hash da senha, então a pessoa entra com a MESMA
 * senha) e auth.identities (login por e-mail), em lotes.
 *
 * Uso:
 *   OLD_DB_URL="postgresql://postgres:SENHA@db.<ref-antigo>.supabase.co:5432/postgres" \
 *   NEW_DB_URL="postgresql://postgres:SENHA@db.dnjrgpldcwcpoywamorr.supabase.co:5432/postgres" \
 *   node scripts/migrar-assinantes-legado.mjs [--dry-run]
 */
import postgres from 'postgres';

const OLD = process.env.OLD_DB_URL;
const NEW = process.env.NEW_DB_URL;
const DRY = process.argv.includes('--dry-run');

if (!OLD || !NEW) {
  console.error('Defina OLD_DB_URL e NEW_DB_URL.');
  process.exit(1);
}

const old = postgres(OLD, { ssl: 'require', max: 2 });
const neu = postgres(NEW, { ssl: 'require', max: 4 });

const users = await old`
  select id, email, encrypted_password, email_confirmed_at, phone,
         raw_user_meta_data, raw_app_meta_data, created_at
    from auth.users
   where email is not null
`;
console.log(`Usuários encontrados no projeto antigo: ${users.length}`);

const existentesRows = await neu`select lower(email) as email, id from auth.users where email is not null`;
const emailsExistentes = new Set(existentesRows.map((r) => r.email));
const idsExistentes = new Set(existentesRows.map((r) => r.id));
console.log(`Usuários já existentes no novo projeto: ${emailsExistentes.size}`);

const pendentes = users.filter(
  (u) => !emailsExistentes.has(String(u.email).toLowerCase()) && !idsExistentes.has(u.id),
);
console.log(`A migrar: ${pendentes.length}`);

if (DRY) {
  console.log('[dry-run] nada foi gravado.');
  await old.end(); await neu.end();
  process.exit(0);
}

let criados = 0, falhas = 0;
const LOTE = 100;
for (let i = 0; i < pendentes.length; i += LOTE) {
  const lote = pendentes.slice(i, i + LOTE);
  for (const u of lote) {
    try {
      await neu.begin(async (tx) => {
        await tx`
          insert into auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data, phone
          ) values (
            '00000000-0000-0000-0000-000000000000', ${u.id}, 'authenticated', 'authenticated',
            ${u.email}, ${u.encrypted_password},
            ${u.email_confirmed_at ?? new Date()}, ${u.created_at}, now(),
            ${tx.json(u.raw_app_meta_data ?? { provider: 'email', providers: ['email'] })},
            ${tx.json(u.raw_user_meta_data ?? {})},
            ${u.phone ?? null}
          )
          on conflict (id) do nothing
        `;
        await tx`
          insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
          values (gen_random_uuid(), ${u.id}, ${u.id},
                  ${tx.json({ sub: u.id, email: u.email, email_verified: true })},
                  'email', ${u.created_at}, now())
          on conflict do nothing
        `;
      });
      criados++;
    } catch (e) {
      falhas++;
      if (falhas <= 5) console.error('falhou', u.email, String(e).slice(0, 200));
    }
  }
  console.log(`progresso: ${Math.min(i + LOTE, pendentes.length)}/${pendentes.length} (criados ${criados}, falhas ${falhas})`);
}

console.log(`Criados: ${criados} | Já existiam: ${users.length - pendentes.length} | Falhas: ${falhas}`);
await old.end();
await neu.end();
