import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado: token ausente.');
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      throw new Error('Não autorizado: sessão inválida.');
    }

    const asaasKey = Deno.env.get('ASAAS_API_KEY') || Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const baseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    if (!asaasKey) {
      throw new Error('ASAAS_API_KEY não configurada no servidor.');
    }

    const [{ data: subsList, error: subErr }, { data: legacyList }] = await Promise.all([
      admin
        .from('asaas_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      admin
        .from('legacy_subscribers')
        .select('*')
        .or(`claimed_user_id.eq.${user.id},email.ilike.${user.email || ''}`),
    ]);

    if (subErr) {
      throw new Error(`Erro ao buscar assinatura: ${subErr.message}`);
    }

    const sub = subsList?.[0] ?? null;

    // 1. Vitalício não tem cobrança recorrente a cancelar (a menos que exista assinatura ativa extra no Asaas)
    const planoLower = (sub?.plano || '').toLowerCase();
    const isVitalicio = planoLower.includes('vitalicio') || planoLower.includes('vitalício');

    // Coleta todos os possíveis customerIds e subscriptionIds (sub_...) do banco e do Asaas
    const customerIds = new Set<string>();
    const subscriptionIds = new Set<string>();

    for (const s of subsList || []) {
      if (s.asaas_customer_id) customerIds.add(String(s.asaas_customer_id));
      if (s.asaas_subscription_id && String(s.asaas_subscription_id).startsWith('sub_')) {
        subscriptionIds.add(String(s.asaas_subscription_id));
      }
    }
    for (const l of legacyList || []) {
      if (l.asaas_customer_id) customerIds.add(String(l.asaas_customer_id));
      if (l.asaas_subscription_id && String(l.asaas_subscription_id).startsWith('sub_')) {
        subscriptionIds.add(String(l.asaas_subscription_id));
      }
    }

    // Busca também clientes no Asaas pelo e-mail do usuário (captura assinaturas duplicadas ou de migração)
    const userEmail = (user.email || '').trim().toLowerCase();
    if (userEmail) {
      try {
        const custRes = await fetch(`${baseUrl}/customers?email=${encodeURIComponent(userEmail)}&limit=20`, {
          headers: { 'access_token': asaasKey },
        });
        if (custRes.ok) {
          const custJson = await custRes.json().catch(() => ({}));
          for (const c of custJson?.data || []) {
            if (c?.id) customerIds.add(String(c.id));
          }
        }
      } catch (e) {
        console.warn('[cancelar-assinatura-asaas] Erro ao buscar clientes por email:', e);
      }
    }

    // Para cada customerId encontrado, lista TODAS as assinaturas recorrentes ativas no Asaas
    for (const cid of customerIds) {
      try {
        const activeSubsRes = await fetch(`${baseUrl}/subscriptions?customer=${encodeURIComponent(cid)}&status=ACTIVE&limit=50`, {
          headers: { 'access_token': asaasKey },
        });
        if (activeSubsRes.ok) {
          const activeSubsJson = await activeSubsRes.json().catch(() => ({}));
          for (const item of activeSubsJson?.data || []) {
            if (item?.id) subscriptionIds.add(String(item.id));
          }
        }
      } catch (e) {
        console.warn('[cancelar-assinatura-asaas] Erro ao listar assinaturas do cliente:', cid, e);
      }
    }

    if (subscriptionIds.size === 0) {
      if (isVitalicio) {
        return new Response(
          JSON.stringify({ error: 'O Plano Vitalício possui acesso permanente e não gera cobranças futuras recorrentes.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (planoLower.includes('pix') || sub?.origem === 'pix') {
        return new Response(
          JSON.stringify({ error: 'Esta assinatura foi contratada via Pix e não possui cobrança automática em cartão.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!sub && (!legacyList || legacyList.length === 0)) {
        throw new Error('Nenhuma assinatura Asaas encontrada para este usuário.');
      }
    }

    // Cancela TODAS as assinaturas recorrentes encontradas no Asaas
    let canceledCount = 0;
    const cancelErrors: string[] = [];

    for (const subId of subscriptionIds) {
      const asaasRes = await fetch(`${baseUrl}/subscriptions/${subId}`, {
        method: 'DELETE',
        headers: { 'access_token': asaasKey },
      });
      const asaasJson = await asaasRes.json().catch(() => ({}));
      console.log('[cancelar-assinatura-asaas] DELETE subscription:', subId, asaasRes.status, asaasJson);

      if (asaasRes.ok || asaasRes.status === 404) {
        canceledCount++;
      } else {
        const msg = asaasJson?.errors?.[0]?.description || asaasJson?.message || `Erro ${asaasRes.status}`;
        cancelErrors.push(`${subId}: ${msg}`);
      }
    }

    if (subscriptionIds.size > 0 && canceledCount === 0 && cancelErrors.length > 0) {
      return new Response(
        JSON.stringify({ error: cancelErrors[0] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualiza todas as linhas do usuário no Supabase mantendo expires_at para não cortar o período pago
    const nowIso = new Date().toISOString();
    if (subsList && subsList.length > 0) {
      await admin
        .from('asaas_subscriptions')
        .update({
          status: 'CANCELED',
          updated_at: nowIso,
        })
        .eq('user_id', user.id);
    }

    if (legacyList && legacyList.length > 0) {
      await admin
        .from('legacy_subscribers')
        .update({ status: 'canceled' })
        .in('id', legacyList.map((l: any) => l.id));
    }

    await admin
      .from('assinatura_cancelamentos')
      .upsert({
        user_id: user.id,
        canceled_at: nowIso,
        motivo: 'Cancelamento de renovação solicitado pelo usuário via app',
      });

    return new Response(
      JSON.stringify({
        success: true,
        canceled_subscriptions: canceledCount,
        message: 'Renovação automática cancelada com sucesso. Seu cartão não será cobrado novamente e seu acesso Premium continuará liberado até o final do período já pago.',
        expires_at: sub?.expires_at ?? null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Erro inesperado ao cancelar assinatura' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
