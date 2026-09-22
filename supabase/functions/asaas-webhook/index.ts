import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { evolution } from '../_shared/evolution.ts';

/**
 * Webhook do Asaas — mantém as assinaturas MENSAIS migradas do app antigo
 * renovando automaticamente em public.asaas_subscriptions e processa
 * novas assinaturas Mensais e pagamentos Vitalícios.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const received = req.headers.get('asaas-access-token') ?? req.headers.get('x-asaas-token');
  if (!expected || received !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const body = await req.json();
    const event: string = body?.event ?? '';
    const payment = body?.payment ?? {};
    const customerId: string | null = payment.customer ?? null;
    const subscriptionId: string | null = payment.subscription ?? null;
    const dueDate: string | null = payment.dueDate ?? payment.nextDueDate ?? null;

    if (!customerId && !subscriptionId) {
      return new Response(JSON.stringify({ ok: true, ignored: 'sem identificador' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Localiza o assinante migrado e o usuário correspondente
    let legacy: any = null;
    if (subscriptionId) {
      const { data } = await admin.from('legacy_subscribers').select('*')
        .eq('asaas_subscription_id', subscriptionId).limit(1).maybeSingle();
      legacy = data;
    }
    if (!legacy && customerId) {
      const { data } = await admin.from('legacy_subscribers').select('*')
        .eq('asaas_customer_id', customerId).limit(1).maybeSingle();
      legacy = data;
    }
    if (!legacy) {
      const email: string | null = body?.payment?.customerEmail ?? null;
      if (email) {
        const { data } = await admin.from('legacy_subscribers').select('*')
          .ilike('email', email).limit(1).maybeSingle();
        legacy = data;
      }
    }
    if (!legacy) {
      // Caso não seja um legado, verificamos se é um usuário novo vindo do app (externalReference = user_id)
      const externalRef = payment.externalReference || body?.customer?.externalReference;
      if (externalRef) {
        let inferredPlan = 'mensal';
        const val = payment.value || 0;
        const desc = (payment.description || '').toLowerCase();
        
        if (desc.includes('vitalicio') || desc.includes('vitalício') || val >= 250) {
          inferredPlan = 'vitalicio';
        } else if (val >= 190 || desc.includes('anual')) {
          inferredPlan = 'anual';
        } else if (val >= 140 && val <= 160) {
          inferredPlan = 'anual'; // Promo Pix
        }

        // Mock a legacy object just to pass the checks, but with claimed_user_id
        legacy = {
          id: 'new_user',
          tipo: inferredPlan,
          claimed_user_id: externalRef,
          asaas_customer_id: customerId,
          asaas_subscription_id: subscriptionId,
        };
      }
    }

    if (!legacy) {
      return new Response(JSON.stringify({ ok: true, ignored: 'assinante não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pago = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_RECEIVED_IN_CASH'].includes(event);
    const atrasado = event === 'PAYMENT_OVERDUE';
    const perdido = [
      'PAYMENT_DELETED', 'PAYMENT_REFUNDED',
      'PAYMENT_CHARGEBACK_REQUESTED', 'SUBSCRIPTION_DELETED',
      'SUBSCRIPTION_INACTIVATED', 'PAYMENT_RECEIVED_IN_CASH_UNDONE',
    ].includes(event);

    // Renovação respeitando o ciclo do plano (mensal/semestral/anual/vitalicio) + margem
    const diasCiclo = legacy.tipo === 'anual' ? 370
      : legacy.tipo === 'semestral' ? 190
      : 34;
    const CARENCIA_MS = 3 * 24 * 3600 * 1000;
    const venc = new Date(dueDate ?? Date.now()).getTime();
    const proximo = pago
      ? new Date(venc + diasCiclo * 24 * 3600 * 1000).toISOString()
      : atrasado
        ? new Date(venc + CARENCIA_MS).toISOString() // acesso só até vencimento + 3 dias
        : null;

    const vitalicio = legacy.tipo === 'vitalicio';
    // Se for vitalício, nunca corta por expiração ou carência de ciclo
    const cortarAgora = !vitalicio && (perdido || (atrasado && Date.now() > venc + CARENCIA_MS));

    if (legacy.id !== 'new_user') {
      await admin.from('legacy_subscribers').update({
        status: cortarAgora ? 'inactive' : 'active',
        expires_at: vitalicio ? null : (proximo ?? legacy.expires_at),
      }).eq('id', legacy.id);
    }

    if (legacy.claimed_user_id) {
      await admin.from('asaas_subscriptions').upsert({
        user_id: legacy.claimed_user_id,
        plano: legacy.tipo,
        status: cortarAgora ? 'CANCELED' : 'ACTIVE',
        asaas_customer_id: customerId ?? legacy.asaas_customer_id,
        asaas_subscription_id: subscriptionId ?? legacy.asaas_subscription_id,
        expires_at: vitalicio ? null : (proximo ?? legacy.expires_at),
        origem: 'asaas',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    // Item 50: Envio de recibo/confirmação via WhatsApp quando pagamento confirmado
    if (pago && legacy.claimed_user_id) {
      (async () => {
        try {
          const { data: profile } = await admin.from('profiles')
            .select('display_name, telefone, whatsapp_number')
            .eq('id', legacy.claimed_user_id)
            .maybeSingle();

          const phone = profile?.whatsapp_number || profile?.telefone;
          if (!phone) return;

          const nome = profile?.display_name?.split(' ')[0] || 'Assinante';
          const valor = payment.value ? `R$ ${Number(payment.value).toFixed(2).replace('.', ',')}` : '';
          const planoLabel = legacy.tipo === 'anual' ? 'Anual' : legacy.tipo === 'vitalicio' ? 'Vitalício' : 'Mensal';

          const msg = `${nome}, seu pagamento${valor ? ` de ${valor}` : ''} do plano *${planoLabel}* foi confirmado! ✅

Seu acesso ao *Direito Prime* está ativo. Bons estudos! 📚

Acesse: https://app.suportedireitoprimeoficial.com`;

          await evolution.sendText(phone, msg);
        } catch (e) {
          console.warn('WhatsApp receipt failed (non-blocking):', String((e as Error)?.message || e).slice(0, 200));
        }
      })();
    }

    return new Response(JSON.stringify({ ok: true, event }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('asaas-webhook falhou:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
