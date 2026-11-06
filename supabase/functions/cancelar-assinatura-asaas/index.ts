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

    // Busca a assinatura mais recente do usuário no Asaas
    const { data: sub, error: subErr } = await admin
      .from('asaas_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr) {
      throw new Error(`Erro ao buscar assinatura: ${subErr.message}`);
    }

    if (!sub) {
      throw new Error('Nenhuma assinatura Asaas encontrada para este usuário.');
    }

    const planoLower = (sub.plano || '').toLowerCase();

    // 1. Vitalício não tem cobrança recorrente a cancelar
    if (planoLower.includes('vitalicio') || planoLower.includes('vitalício')) {
      return new Response(
        JSON.stringify({
          error: 'O Plano Vitalício possui acesso permanente e não gera cobranças futuras recorrentes.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Pagamento via Pix não tem cobrança automática em cartão
    if (planoLower.includes('pix') || sub.origem === 'pix' || !sub.asaas_subscription_id) {
      return new Response(
        JSON.stringify({
          error: 'Esta assinatura foi contratada via Pix e não possui cobrança automática em cartão.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const asaasKey = Deno.env.get('ASAAS_API_KEY') || Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const baseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    if (!asaasKey) {
      throw new Error('ASAAS_API_KEY não configurada no servidor.');
    }

    // 3. Cancela a assinatura na API do Asaas (DELETE /v3/subscriptions/{id})
    const asaasRes = await fetch(`${baseUrl}/subscriptions/${sub.asaas_subscription_id}`, {
      method: 'DELETE',
      headers: {
        'access_token': asaasKey,
      },
    });

    const asaasJson = await asaasRes.json();
    console.log('[cancelar-assinatura-asaas] Resposta Asaas:', asaasJson);

    // 4. Atualiza o status no Supabase mantendo expires_at para não cortar o acesso adquirido
    const nowIso = new Date().toISOString();
    await admin
      .from('asaas_subscriptions')
      .update({
        status: 'CANCELED',
        updated_at: nowIso,
      })
      .eq('id', sub.id);

    // 5. Registra o cancelamento da recorrência na tabela de cancelamentos
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
        message: 'Renovação automática cancelada com sucesso. Seu cartão não será cobrado novamente e seu acesso Premium continuará liberado até o final do período já pago.',
        expires_at: sub.expires_at,
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

