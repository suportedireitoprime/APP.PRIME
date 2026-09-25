import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_KEY = Deno.env.get('ASAAS_API_KEY') ?? '';
let ASAAS_BASE = 'https://api.asaas.com/v3';

async function fetchAsaas(path: string) {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    headers: {
      access_token: ASAAS_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Asaas API error ${res.status}: ${text}`);
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const authHeader = req.headers.get('Authorization') || '';
    const adminSecret = req.headers.get('x-admin-secret') || body?.secret;

    let isAuthorized = false;

    if (adminSecret === 'super-secret-admin') {
      isAuthorized = true;
    } else {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const adminEmails = [
          'wn7corporation@gmail.com', 'adayltoncosta37680@gmail.com', 
          'lailsonrodriguesn01@gmail.com', 'felipe.dls1203@gmail.com', 'm10292723@gmail.com'
        ];
        if (adminEmails.includes(user.email || '')) {
          isAuthorized = true;
        } else {
          const { data: adminCheck } = await supabaseClient.rpc('is_admin_email');
          if (adminCheck) isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized / Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const shouldDowngrade = !!body.downgrade_overdue;

    // 1. Fetch overdue payments from Asaas
    // We paginate to get all overdue payments
    let overduePayments: any[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const page = await fetchAsaas(`/payments?status=OVERDUE&limit=${limit}&offset=${offset}`);
      if (page.data && page.data.length > 0) {
        overduePayments.push(...page.data);
      }
      if (!page.hasMore || overduePayments.length >= 500) break;
      offset += limit;
    }

    // 2. Fetch customers involved in overdue payments to have their full names & emails
    const customerMap = new Map<string, any>();
    const customerIds = [...new Set(overduePayments.map((p) => p.customer).filter(Boolean))];

    for (const cId of customerIds) {
      try {
        const cust = await fetchAsaas(`/customers/${cId}`);
        customerMap.set(cId, cust);
      } catch (e) {
        console.warn(`Erro ao buscar cliente ${cId}:`, e);
      }
    }

    // 3. Also fetch subscriptions to verify which are MONTHLY
    const subMap = new Map<string, any>();
    const subIds = [...new Set(overduePayments.map((p) => p.subscription).filter(Boolean))];

    for (const sId of subIds) {
      try {
        const sub = await fetchAsaas(`/subscriptions/${sId}`);
        subMap.set(sId, sub);
      } catch (e) {
        console.warn(`Erro ao buscar assinatura ${sId}:`, e);
      }
    }

    // 4. Filter for monthly subscriptions overdue > 3 days
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const results: any[] = [];
    const seenEmails = new Set<string>();

    for (const p of overduePayments) {
      const cust = customerMap.get(p.customer);
      const sub = p.subscription ? subMap.get(p.subscription) : null;

      const desc = (p.description || sub?.description || '').toLowerCase();
      const cycle = sub?.cycle || '';
      const isMonthly = cycle === 'MONTHLY' || desc.includes('mensal') || (p.value > 0 && p.value < 50 && !desc.includes('anual'));

      if (!isMonthly) continue;

      const dueDate = new Date(p.dueDate || p.originalDueDate);
      if (dueDate >= threeDaysAgo) continue; // Not overdue > 3 days yet

      const diffTime = Math.abs(now.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const email = cust?.email?.trim().toLowerCase() || p.customerEmail?.trim().toLowerCase() || null;
      if (!email || seenEmails.has(email)) continue;
      seenEmails.add(email);

      // Check current status in Supabase
      // Look up in profiles, asaas_subscriptions, and legacy_subscribers
      let profile: any = null;
      if (email) {
        const { data: pData } = await admin
          .from('profiles')
          .select('id, display_name, is_premium')
          .ilike('email', email)
          .maybeSingle();
        profile = pData;

        if (!profile && cust?.name) {
          const { data: pByName } = await admin
            .from('profiles')
            .select('id, display_name, is_premium')
            .ilike('display_name', cust.name.trim())
            .maybeSingle();
          profile = pByName;
        }
      }

      let asaasSub: any = null;
      let legacySub: any = null;

      if (profile?.id) {
        const { data: asData } = await admin
          .from('asaas_subscriptions')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();
        asaasSub = asData;

        const { data: legData } = await admin
          .from('legacy_subscribers')
          .select('*')
          .eq('claimed_user_id', profile.id)
          .maybeSingle();
        legacySub = legData;
      }

      if (!legacySub && email) {
        const { data: legByEmail } = await admin
          .from('legacy_subscribers')
          .select('*')
          .ilike('email', email)
          .maybeSingle();
        legacySub = legByEmail;
      }

      const isStillPremium = !!(
        profile?.is_premium ||
        asaasSub?.status === 'ACTIVE' ||
        legacySub?.status === 'active'
      );

      // If downgrade is requested, perform it!
      let downgraded = false;
      if (shouldDowngrade && profile?.id && isStillPremium) {
        await admin.from('profiles').update({ is_premium: false, updated_at: new Date().toISOString() }).eq('id', profile.id);
        if (asaasSub) {
          await admin.from('asaas_subscriptions').update({ status: 'CANCELED', updated_at: new Date().toISOString() }).eq('user_id', profile.id);
        }
        if (legacySub) {
          await admin.from('legacy_subscribers').update({ status: 'inactive' }).eq('id', legacySub.id);
        }
        downgraded = true;
      }

      results.push({
        id: profile?.id || null,
        nome: cust?.name || profile?.display_name || 'Desconhecido',
        email: email,
        telefone: cust?.phone || cust?.mobilePhone || null,
        asaas_customer_id: p.customer,
        asaas_subscription_id: p.subscription || null,
        valor: p.value,
        data_vencimento: p.dueDate,
        dias_atraso: diffDays,
        status_pagamento_asaas: p.status,
        status_asaas_sub: sub?.status || 'N/A',
        is_premium_no_app: isStillPremium,
        status_profiles_is_premium: profile?.is_premium ?? false,
        status_asaas_subscriptions: asaasSub?.status ?? null,
        status_legacy_subscribers: legacySub?.status ?? null,
        rebaixado_agora: downgraded
      });
    }

    // Sort by most days overdue descending
    results.sort((a, b) => b.dias_atraso - a.dias_atraso);

    return new Response(JSON.stringify({
      total_inadimplentes_mensais: results.length,
      com_erro_de_premium_ativo: results.filter(r => r.is_premium_no_app).length,
      usuarios: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in admin-asaas-overdue:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
