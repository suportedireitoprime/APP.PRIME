import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

/**
 * legacy-sync — traz assinantes premium do Asaas e do Supabase antigo
 * para public.legacy_subscribers (upsert por e-mail, sem tocar em claimed_user_id).
 *
 * POST body:
 *  { action: "discover" }                      -> lista tabelas do supabase antigo + testa Asaas
 *  { action: "peek", table: "assinantes" }     -> mostra 5 linhas da tabela antiga
 *  { action: "sync", sources: ["asaas","old"], table?: string, apply?: boolean }
 */

const ASAAS_KEY = Deno.env.get('ASAAS_API_KEY') ?? '';
const OLD_URL = (Deno.env.get('OLD_SUPABASE_URL') ?? '').replace(/\/+$/, '');
const OLD_KEY = Deno.env.get('OLD_SUPABASE_SERVICE_ROLE_KEY') ?? '';
// Opaque keys (sb_secret_...) must go only in apikey, never as Bearer.
function oldHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { apikey: OLD_KEY, ...extra };
  if (!OLD_KEY.startsWith('sb_')) h.Authorization = `Bearer ${OLD_KEY}`;
  return h;
}
let ASAAS_BASE = 'https://api.asaas.com/v3';
const ASAAS_BASES = ['https://api.asaas.com/v3', 'https://api-sandbox.asaas.com/v3'];

/** Descobre em qual ambiente (produção/sandbox) a chave funciona */
async function resolveAsaasBase() {
  let last = '';
  for (const base of ASAAS_BASES) {
    const res = await fetch(`${base}/customers?limit=1`, {
      headers: { access_token: ASAAS_KEY, 'Content-Type': 'application/json' },
    });
    if (res.ok) { ASAAS_BASE = base; return base; }
    last = `${base} -> ${res.status} ${(await res.text()).slice(0, 200)}`;
  }
  throw new Error(`Nenhum ambiente Asaas aceitou a chave. Último: ${last}`);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function asaas(path: string) {
  let last = '';
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const res = await fetch(`${ASAAS_BASE}${path}`, {
      headers: { access_token: ASAAS_KEY, 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    if (res.ok) return JSON.parse(text);
    last = `${res.status}: ${text.slice(0, 200)}`;
    if (res.status !== 429 && res.status !== 403 && res.status < 500) break;
    await new Promise((r) => setTimeout(r, 2000 * (tentativa + 1)));
  }
  throw new Error(`Asaas ${last}`);
}

async function oldRest(path: string) {
  const res = await fetch(`${OLD_URL}/rest/v1${path}`, {
    headers: oldHeaders(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Old Supabase ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

/** Lista as tabelas expostas pela Data API do projeto antigo */
async function discoverTables(): Promise<string[]> {
  try {
    const spec = await oldRest('/');
    const keys = Object.keys(spec?.definitions ?? spec?.components?.schemas ?? {});
    if (keys.length) return keys.sort();
  } catch {
    /* spec desativado — cai no probe abaixo */
  }
  // Data API sem OpenAPI: testa nomes prováveis um a um
  const candidatos = [
    'assinantes', 'assinaturas', 'subscribers', 'subscriptions', 'profiles', 'usuarios',
    'users', 'clientes', 'customers', 'membros', 'members', 'legacy_subscribers',
    'asaas_subscriptions', 'pagamentos', 'payments', 'planos', 'alunos', 'premium_users',
  ];
  const achadas: string[] = [];
  (globalThis as any).__probeLog = [];
  for (const t of candidatos) {
    try {
      const res = await fetch(`${OLD_URL}/rest/v1/${t}?select=*&limit=1`, {
        headers: oldHeaders(),
      });
      if (res.ok) achadas.push(t);
      const body = await res.text();
      (globalThis as any).__probeLog.push(`${t}:${res.status}:${body.slice(0, 120)}`);
    } catch { /* ignora */ }
  }
  return achadas;
}

function pick(row: Record<string, any>, keys: string[]): any {
  for (const k of Object.keys(row)) {
    if (keys.includes(k.toLowerCase()) && row[k] != null && row[k] !== '') return row[k];
  }
  return null;
}

const EMAIL_KEYS = ['email', 'e_mail', 'mail', 'user_email', 'customer_email'];
const NAME_KEYS = ['nome', 'name', 'full_name', 'display_name', 'nome_completo'];
const TYPE_KEYS = ['tipo', 'type', 'plano', 'plan', 'subscription_type', 'tipo_assinatura'];
const EXP_KEYS = ['expires_at', 'expira_em', 'validade', 'valid_until', 'data_expiracao', 'next_due_date', 'vencimento'];
const STATUS_KEYS = ['status', 'situacao', 'ativo', 'active', 'is_active'];

function normTipo(raw: any, fallback = 'mensal'): string {
  const v = String(raw ?? '').toLowerCase();
  if (/vital|lifetime|perp|permanent/.test(v)) return 'vitalicio';
  if (/anu|year|annual/.test(v)) return 'anual';
  if (/mens|month/.test(v)) return 'mensal';
  return fallback;
}

/** Assinaturas ativas do Asaas + e-mail do cliente */
async function fromAsaas() {
  const out: any[] = [];
  const custCache = new Map<string, any>();
  // Carrega todos os clientes em páginas (evita 1 request por assinatura → bloqueio do WAF)
  let cOff = 0;
  while (true) {
    const page = await asaas(`/customers?limit=100&offset=${cOff}`);
    for (const c of page.data ?? []) custCache.set(c.id, c);
    if (!page.hasMore) break;
    cOff += 100;
    await new Promise((r) => setTimeout(r, 250));
  }
  let offset = 0;
  while (true) {
    const page = await asaas(`/subscriptions?status=ACTIVE&limit=100&offset=${offset}`);
    for (const sub of page.data ?? []) {
      let cust = custCache.get(sub.customer);
      if (!cust) {
        cust = await asaas(`/customers/${sub.customer}`);
        custCache.set(sub.customer, cust);
        await new Promise((r) => setTimeout(r, 250));
      }
      const email = (cust?.email ?? '').trim().toLowerCase();
      if (!email) continue;
      const cycle = String(sub.cycle ?? '').toUpperCase();
      const tipo = /YEAR|ANNUAL/.test(cycle) ? 'anual' : 'mensal';
      // tolerância de 5 dias após o vencimento
      const due = sub.nextDueDate ? new Date(`${sub.nextDueDate}T23:59:59Z`) : null;
      if (due) due.setUTCDate(due.getUTCDate() + 5);
      out.push({
        email,
        nome: cust?.name ?? null,
        tipo,
        status: 'active',
        asaas_customer_id: sub.customer,
        asaas_subscription_id: sub.id,
        expires_at: due ? due.toISOString() : null,
        _source: 'asaas',
      });
    }
    if (!page.hasMore) break;
    offset += 100;
    await new Promise((r) => setTimeout(r, 250));
  }
  return out;
}

/** Assinantes da base antiga */
async function fromOld(table: string) {
  const out: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const rows: any[] = await oldRest(`/${table}?select=*&limit=${step}&offset=${from}`);
    if (!rows?.length) break;
    for (const row of rows) {
      const email = String(pick(row, EMAIL_KEYS) ?? '').trim().toLowerCase();
      if (!email || !email.includes('@')) continue;
      const statusRaw = pick(row, STATUS_KEYS);
      const inativo = statusRaw === false || /inativ|cancel|expir|suspens/i.test(String(statusRaw ?? ''));
      const exp = pick(row, EXP_KEYS);
      out.push({
        email,
        nome: pick(row, NAME_KEYS),
        tipo: normTipo(pick(row, TYPE_KEYS), 'vitalicio'),
        status: inativo ? 'inactive' : 'active',
        expires_at: exp ? new Date(exp).toISOString() : null,
        _source: 'old',
      });
    }
    if (rows.length < step) break;
    from += step;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? 'discover';

    if (action === 'discover') {
      const result: any = {};
      result.old_host = OLD_URL ? new URL(OLD_URL).host : '(vazio)';
      result.old_key_prefix = OLD_KEY ? OLD_KEY.slice(0, 10) : '(vazio)';
      try {
        const res = await fetch(`${OLD_URL}/rest/v1/`, {
          headers: oldHeaders({ Accept: 'application/openapi+json' }),
        });
        result.old_root_status = res.status;
        result.old_root_body = (await res.text()).slice(0, 300);
      } catch (e) { result.old_root_error = String(e); }
      try {
        result.old_tables = await discoverTables();
        result.old_probe = (globalThis as any).__probeLog ?? [];
      } catch (e) { result.old_error = String(e); }
      try {
        result.asaas_base = await resolveAsaasBase();
        const p = await asaas('/subscriptions?status=ACTIVE&limit=1');
        result.asaas_ok = true;
        result.asaas_total_ativas = p.totalCount;
      } catch (e) { result.asaas_error = String(e); }
      return json(result);
    }

    if (action === 'peek') {
      const rows = await oldRest(`/${body.table}?select=*&limit=5`);
      return json({ table: body.table, sample: rows });
    }

    if (action === 'probe') {
      if (body.diag) {
        const semKey = await fetch(`${OLD_URL}/rest/v1/`);
        const comKey = await fetch(`${OLD_URL}/rest/v1/`, {
          headers: oldHeaders(),
        });
        return json({
          sem_key: { status: semKey.status, body: (await semKey.text()).slice(0, 200) },
          com_key: {
            status: comKey.status,
            body: (await comKey.text()).slice(0, 200),
            headers: Object.fromEntries(comKey.headers.entries()),
          },
        });
      }
      const cands: string[] = body.tables ?? [
        'legacy_subscribers', 'assinantes', 'subscribers', 'subscriptions',
        'asaas_subscriptions', 'profiles', 'usuarios', 'users', 'premium_users',
        'assinaturas', 'planos', 'user_subscriptions', 'clientes',
      ];
      const found: any[] = [];
      for (const t of cands) {
        const res = await fetch(`${OLD_URL}/rest/v1/${t}?select=*&limit=1`, {
          headers: oldHeaders({ Prefer: 'count=exact', Range: '0-0' }),
        });
        const txt = await res.text();
        found.push({
          table: t,
          status: res.status,
          count: res.headers.get('content-range'),
          columns: res.ok ? Object.keys(JSON.parse(txt)?.[0] ?? {}) : txt.slice(0, 120),
        });
      }
      return json({ found });
    }

    if (action === 'sync') {
      const sources: string[] = body.sources ?? ['asaas', 'old'];
      const apply: boolean = body.apply === true;
      const collected: any[] = [];
      const errors: any = {};

      if (sources.includes('asaas')) {
        try { await resolveAsaasBase(); collected.push(...await fromAsaas()); }
        catch (e) { errors.asaas = String(e); }
      }
      if (sources.includes('old') && body.table) {
        try { collected.push(...await fromOld(body.table)); }
        catch (e) { errors.old = String(e); }
      }

      // Linhas enviadas direto no body (importação manual do banco antigo)
      if (Array.isArray(body.rows)) {
        for (const r of body.rows) collected.push({ ...r, _source: 'manual' });
      }

      // Dedup por e-mail: Asaas ganha (tem dados de cobrança), exceto se o antigo for vitalício
      const byEmail = new Map<string, any>();
      for (const r of collected) {
        const prev = byEmail.get(r.email);
        if (!prev) { byEmail.set(r.email, r); continue; }
        if (prev.tipo === 'vitalicio' || r.tipo === 'vitalicio') {
          byEmail.set(r.email, { ...prev, ...r, tipo: 'vitalicio', expires_at: null });
        } else if (r._source === 'asaas') {
          byEmail.set(r.email, { ...prev, ...r });
        }
      }

      const rows = [...byEmail.values()].map(({ _source, ...r }) => r);

      if (!apply) {
        const { data: existing } = await admin.from('legacy_subscribers')
          .select('email').in('email', rows.slice(0, 1000).map((r) => r.email));
        const known = new Set((existing ?? []).map((e: any) => e.email));
        return json({
          dry_run: true,
          total: rows.length,
          novos: rows.filter((r) => !known.has(r.email)).length,
          atualizados: rows.filter((r) => known.has(r.email)).length,
          errors,
          sample: rows.slice(0, 10),
        });
      }

      // O índice único é por lower(email) (expressão), então não dá para usar upsert:
      // buscamos os existentes e fazemos update/insert manualmente.
      const { data: existentes } = await admin.from('legacy_subscribers').select('id,email');
      const idPorEmail = new Map<string, string>();
      for (const e of existentes ?? []) idPorEmail.set(String((e as any).email).toLowerCase(), (e as any).id);

      let atualizados = 0;
      let inseridos = 0;
      const novos: any[] = [];
      for (const r of rows) {
        const id = idPorEmail.get(r.email);
        if (id) {
          const { error } = await admin.from('legacy_subscribers').update(r).eq('id', id);
          if (error) throw new Error(`update ${r.email}: ${error.message}`);
          atualizados++;
        } else {
          novos.push(r);
        }
      }
      for (let i = 0; i < novos.length; i += 200) {
        const chunk = novos.slice(i, i + 200);
        const { error } = await admin.from('legacy_subscribers').insert(chunk);
        if (error) throw new Error(`insert: ${error.message}`);
        inseridos += chunk.length;
      }
      return json({ applied: true, atualizados, inseridos, errors });
    }

    return json({ error: 'action inválida' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
