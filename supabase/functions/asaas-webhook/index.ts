import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { evolution } from '../_shared/evolution.ts';
import { syncHorusSubscriptionStatus } from '../_shared/horus-plan.ts';

/**
 * Webhook do Asaas — mantém as assinaturas MENSAIS migradas do app antigo
 * renovando automaticamente em public.asaas_subscriptions e processa
 * novas assinaturas Mensais e pagamentos Vitalícios.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const received = req.headers.get('asaas-access-token') ?? req.headers.get('x-asaas-token');
  if (expected && received !== expected) {
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
    // Inferência inteligente do plano da cobrança atual (independente de ser legado ou novo)
    const val = payment.value || 0;
    const desc = (payment.description || '').toLowerCase();
    const isParcelado = desc.includes('parcelad') || !!payment.installment || !!payment.installmentNumber;

    let inferredPlan = 'anual';
    if (desc.includes('mensal') || (!isParcelado && val > 0 && val < 50 && !desc.includes('anual') && !desc.includes('vitalicio'))) {
      inferredPlan = 'mensal';
    } else if (desc.includes('promo') || (val >= 140 && val <= 165)) {
      inferredPlan = 'anual_promocional';
    } else {
      inferredPlan = 'anual';
    }

    if (!legacy) {
      // Caso não seja um legado pelo Asaas ID, verificamos externalReference (user_id do app)
      const externalRef = payment.externalReference || body?.customer?.externalReference;
      if (externalRef) {
        legacy = {
          id: 'new_user',
          tipo: inferredPlan,
          claimed_user_id: externalRef,
          asaas_customer_id: customerId,
          asaas_subscription_id: subscriptionId,
        };
      }
    }

    // Se ainda não achou legacy mas temos customerEmail, busca por profile existente
    const customerEmail: string | null = payment?.customerEmail || body?.customerEmail || null;
    let targetUserId: string | null = legacy?.claimed_user_id || payment.externalReference || body?.customer?.externalReference || null;

    if (!targetUserId && customerEmail) {
      const { data: userProfile } = await admin.from('profiles').select('id').ilike('email', customerEmail.trim()).limit(1).maybeSingle();
      if (userProfile?.id) {
        targetUserId = userProfile.id;
      }
    }

    if (!legacy && targetUserId) {
      legacy = {
        id: 'new_user',
        tipo: inferredPlan,
        claimed_user_id: targetUserId,
        asaas_customer_id: customerId,
        asaas_subscription_id: subscriptionId,
      };
    }

    if (!legacy) {
      return new Response(JSON.stringify({ ok: true, ignored: 'assinante não encontrado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Plano efetivo: se for um novo pagamento confirmado ou cobrança, prioriza o plano detectado na transação atual
    const pago = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_RECEIVED_IN_CASH'].includes(event);
    const atrasado = event === 'PAYMENT_OVERDUE';
    const perdido = [
      'PAYMENT_DELETED', 'PAYMENT_REFUNDED',
      'PAYMENT_CHARGEBACK_REQUESTED', 'SUBSCRIPTION_DELETED',
      'SUBSCRIPTION_INACTIVATED', 'PAYMENT_RECEIVED_IN_CASH_UNDONE',
    ].includes(event);

    // Se a cobrança atual define claramente o plano (ex: anual ou mensal), atualiza o plano do usuário
    let effectivePlan = legacy.tipo;
    if (pago || event === 'PAYMENT_CREATED' || event === 'PAYMENT_UPDATED') {
      if (desc.includes('anual') || isParcelado || val >= 100) {
        effectivePlan = inferredPlan;
      } else if (desc.includes('mensal') || (val > 0 && val < 50)) {
        effectivePlan = 'mensal';
      }
    }
    if (legacy.tipo === 'vitalicio' && !desc.includes('mensal') && !desc.includes('anual')) {
      effectivePlan = 'vitalicio';
    }

    // Renovação respeitando o ciclo do plano (mensal/semestral/anual/vitalicio) + margem
    const diasCiclo = (effectivePlan === 'anual' || effectivePlan === 'anual_promocional') ? 370
      : effectivePlan === 'semestral' ? 190
      : 34;
    const CARENCIA_MS = 3 * 24 * 3600 * 1000;
    const venc = new Date(dueDate ?? Date.now()).getTime();
    const proximo = pago
      ? new Date(venc + diasCiclo * 24 * 3600 * 1000).toISOString()
      : atrasado
        ? new Date(venc + CARENCIA_MS).toISOString() // acesso só até vencimento + 3 dias
        : null;

    const vitalicio = effectivePlan === 'vitalicio';
    // Se for vitalício, nunca corta por expiração ou carência de ciclo
    const cortarAgora = !vitalicio && (perdido || (atrasado && Date.now() > venc + CARENCIA_MS));

    if (legacy.id !== 'new_user') {
      await admin.from('legacy_subscribers').update({
        tipo: effectivePlan,
        status: cortarAgora ? 'inactive' : 'active',
        expires_at: vitalicio ? null : (proximo ?? legacy.expires_at),
        claimed_user_id: targetUserId ?? legacy.claimed_user_id,
        claimed_at: targetUserId && !legacy.claimed_user_id ? new Date().toISOString() : legacy.claimed_at,
      }).eq('id', legacy.id);
    }

    const finalUserId = targetUserId || legacy.claimed_user_id;

    if (finalUserId) {
      const subUpsertPayload: any = {
        user_id: finalUserId,
        plano: effectivePlan,
        status: cortarAgora ? 'CANCELED' : 'ACTIVE',
        asaas_customer_id: customerId ?? legacy.asaas_customer_id,
        asaas_subscription_id: subscriptionId ?? legacy.asaas_subscription_id,
        expires_at: vitalicio ? null : (proximo ?? legacy.expires_at),
        origem: 'asaas',
        updated_at: new Date().toISOString(),
      };
      if (pago) {
        subUpsertPayload.started_at = new Date().toISOString();
      }
      await admin.from('asaas_subscriptions').upsert(subUpsertPayload, { onConflict: 'user_id' });

      // Atualiza também profiles para manter is_premium sincronizado em 100% dos lugares
      if (pago) {
        await admin.from('profiles').update({
          is_premium: true,
          updated_at: new Date().toISOString()
        }).eq('id', finalUserId);

        // Registra evento de compra no app_events para histórico e métricas
        await admin.from('app_events').insert({
          user_id: finalUserId,
          email: payment?.customerEmail ?? null,
          event_name: 'purchase',
          metadata: {
            plano: effectivePlan,
            value: payment.value || 0,
            currency: 'BRL',
            source: 'asaas',
            payment_id: payment.id,
            billingType: payment.billingType
          }
        });
      } else if (cortarAgora) {
        await admin.from('profiles').update({
          is_premium: false,
          updated_at: new Date().toISOString()
        }).eq('id', finalUserId);
      }
      // Sincroniza imediatamente o plano no Horus (WhatsApp)
      syncHorusSubscriptionStatus(admin, {
        userId: finalUserId,
        isPremium: !cortarAgora && (pago || legacy.status === 'active'),
        plano: effectivePlan,
        expiresAt: vitalicio ? null : (proximo ?? legacy.expires_at),
        notifyWhatsapp: false, // O recibo abaixo já faz a notificação via WhatsApp
      }).catch((e) => console.warn('syncHorusSubscriptionStatus error in asaas-webhook:', e));
    }

    // Item 50: Envio de recibo/confirmação via WhatsApp quando pagamento confirmado
    if (pago && finalUserId) {
      (async () => {
        try {
          const { data: profile } = await admin.from('profiles')
            .select('display_name, telefone, whatsapp_number')
            .eq('id', finalUserId)
            .maybeSingle();

          const phone = profile?.whatsapp_number || profile?.telefone;
          if (!phone) return;

          const nome = profile?.display_name?.split(' ')[0] || 'Assinante';
          const valor = payment.value ? `R$ ${Number(payment.value).toFixed(2).replace('.', ',')}` : '';
          const planoLabel = (effectivePlan === 'anual' || effectivePlan === 'anual_promocional') ? 'Anual' : effectivePlan === 'vitalicio' ? 'Vitalício' : 'Mensal';

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
