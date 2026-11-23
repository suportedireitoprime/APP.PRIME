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
    // Inferência inteligente do plano da cobrança atual (independente de ser legado ou novo)
    const val = payment.value || 0;
    const desc = (payment.description || '').toLowerCase();
    const isParcelado = desc.includes('parcelad') || !!payment.installment || !!payment.installmentNumber;

    // Se temos externalReference (user_id|plan)
    const rawExternalRef = payment.externalReference || body?.customer?.externalReference || '';
    let externalRefUserId = rawExternalRef;
    let externalRefPlan: string | null = null;
    if (rawExternalRef.includes('|')) {
      const parts = rawExternalRef.split('|');
      externalRefUserId = parts[0];
      externalRefPlan = parts[1];
    }

    let inferredPlan = 'anual';
    if (externalRefPlan) {
      if (externalRefPlan.startsWith('vitalicio')) inferredPlan = 'vitalicio';
      else if (externalRefPlan.startsWith('mensal')) inferredPlan = 'mensal';
      else if (externalRefPlan.startsWith('anual') || externalRefPlan === 'anual_regular_pix') inferredPlan = 'anual';
      else if (externalRefPlan === 'promocao') inferredPlan = 'anual_promocional';
    } else if (desc.includes('vitalicio') || desc.includes('vitalício') || desc.includes('vital') || (val >= 140 && val <= 180 && !desc.includes('anual'))) {
      inferredPlan = 'vitalicio';
    } else if (desc.includes('mensal') || (!isParcelado && val > 0 && val < 50 && !desc.includes('anual') && !desc.includes('vitalicio') && !desc.includes('vitalício') && !desc.includes('vital'))) {
      inferredPlan = 'mensal';
    } else if (desc.includes('promo')) {
      inferredPlan = 'anual_promocional';
    } else {
      inferredPlan = 'anual';
    }

    if (!legacy) {
      if (externalRefUserId) {
        legacy = {
          id: 'new_user',
          tipo: inferredPlan,
          claimed_user_id: externalRefUserId,
          asaas_customer_id: customerId,
          asaas_subscription_id: subscriptionId,
        };
      }
    }
    // Fallback 4: Busca na tabela asaas_subscriptions (o checkout já insere um registro lá)
    if (!legacy && (subscriptionId || customerId)) {
      let subRow: any = null;
      if (subscriptionId) {
        const { data } = await admin.from('asaas_subscriptions')
          .select('user_id, plano')
          .eq('asaas_subscription_id', subscriptionId)
          .limit(1).maybeSingle();
        subRow = data;
      }
      if (!subRow && customerId) {
        const { data } = await admin.from('asaas_subscriptions')
          .select('user_id, plano')
          .eq('asaas_customer_id', customerId)
          .limit(1).maybeSingle();
        subRow = data;
      }
      if (subRow?.user_id) {
        legacy = {
          id: 'new_user',
          tipo: subRow.plano || inferredPlan,
          claimed_user_id: subRow.user_id,
          asaas_customer_id: customerId,
          asaas_subscription_id: subscriptionId,
        };
      }
    }

    // Fallback 5: Busca externalReference na subscription via Asaas API
    if (!legacy && subscriptionId) {
      try {
        const apiKey = Deno.env.get('ASAAS_API_KEY') || Deno.env.get('ASAAS_WEBHOOK_TOKEN');
        const baseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';
        if (apiKey) {
          const subRes = await fetch(`${baseUrl}/subscriptions/${subscriptionId}`, {
            headers: { 'access_token': apiKey },
          });
          if (subRes.ok) {
            const subJson = await subRes.json();
            const subExtRef = subJson.externalReference || '';
            const subExtUserId = subExtRef.includes('|') ? subExtRef.split('|')[0] : subExtRef;
            if (subExtUserId) {
              legacy = {
                id: 'new_user',
                tipo: inferredPlan,
                claimed_user_id: subExtUserId,
                asaas_customer_id: customerId,
                asaas_subscription_id: subscriptionId,
              };
            }
          }
        }
      } catch (e) {
        console.warn('Fallback Asaas API subscription lookup failed:', e);
      }
    }

    // Se ainda não achou legacy mas temos customerEmail, busca por profile existente
    const customerEmail: string | null = payment?.customerEmail || body?.customerEmail || null;
    let targetUserId: string | null = legacy?.claimed_user_id || null;
    
    if (!targetUserId && (payment.externalReference || body?.customer?.externalReference)) {
        const rawRef = payment.externalReference || body?.customer?.externalReference;
        targetUserId = rawRef.includes('|') ? rawRef.split('|')[0] : rawRef;
    }

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

    const finalUserId = targetUserId || legacy.claimed_user_id;
    let currSub: any = null;
    if (finalUserId) {
      const { data } = await admin.from('asaas_subscriptions').select('status, plano, started_at, created_at').eq('user_id', finalUserId).maybeSingle();
      currSub = data;
      // Se o usuário já é vitalício no banco, preserva o vitalício contra cancelamentos acidentais de gateway
      if (currSub?.plano === 'vitalicio' && !pago) {
        effectivePlan = 'vitalicio';
      }
    }

    // Regra oficial: Qualquer assinatura anual adquirida antes de 10/11/2026 é tratada como vitalícia.
    // Assinaturas anuais só têm contagem de ciclo (370 dias) a partir de 10/11/2026 em diante.
    // Assinaturas mensais continuam mensais normalmente.
    const CUTOFF_ANUAL_MS = new Date('2026-11-10T00:00:00.000Z').getTime();
    const isAnual = (effectivePlan === 'anual' || effectivePlan === 'anual_promocional');
    const legacyCreatedAtMs = legacy?.created_at ? new Date(legacy.created_at).getTime() : 0;
    const paymentCreatedMs = payment?.dateCreated ? new Date(payment.dateCreated).getTime() : 0;
    const currSubStartedAtMs = currSub?.started_at ? new Date(currSub.started_at).getTime() : 0;
    const currSubCreatedAtMs = currSub?.created_at ? new Date(currSub.created_at).getTime() : 0;

    if (isAnual && (
      (legacyCreatedAtMs > 0 && legacyCreatedAtMs < CUTOFF_ANUAL_MS) ||
      (paymentCreatedMs > 0 && paymentCreatedMs < CUTOFF_ANUAL_MS) ||
      (currSubStartedAtMs > 0 && currSubStartedAtMs < CUTOFF_ANUAL_MS) ||
      (currSubCreatedAtMs > 0 && currSubCreatedAtMs < CUTOFF_ANUAL_MS) ||
      (legacy?.id !== 'new_user' && legacyCreatedAtMs < CUTOFF_ANUAL_MS)
    )) {
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

    if (finalUserId) {
      let currentStatus = 'PENDING';
      if (currSub?.status) {
        currentStatus = currSub.status;
      }
      
      // Vitalício SÓ ativa se pago === true. Se já era vitalício ativo no banco, preserva o status ativo.
      const isAlreadyActiveVitalicio = currSub?.plano === 'vitalicio' && ['ACTIVE', 'ACTIVE_GRACE', 'active', 'CONFIRMED'].includes(currSub?.status);
      const nextStatus = pago ? 'ACTIVE' : (isAlreadyActiveVitalicio ? 'ACTIVE' : (cortarAgora ? 'CANCELED' : currentStatus));

      const subUpsertPayload: any = {
        user_id: finalUserId,
        plano: effectivePlan,
        status: nextStatus,
        asaas_customer_id: customerId ?? legacy.asaas_customer_id,
        asaas_subscription_id: subscriptionId ?? legacy.asaas_subscription_id,
        expires_at: vitalicio ? null : (proximo ?? legacy.expires_at),
        origem: 'asaas',
        updated_at: new Date().toISOString(),
      };
      if (currSub?.started_at) {
        // Preserva started_at original para não destruir histórico e manter grandfathering
        subUpsertPayload.started_at = currSub.started_at;
      } else if (pago) {
        subUpsertPayload.started_at = new Date().toISOString();
      }
      await admin.from('asaas_subscriptions').upsert(subUpsertPayload, { onConflict: 'user_id' });

      // Atualiza também profiles para manter is_premium sincronizado em 100% dos lugares
      if (pago) {
        await admin.from('profiles').update({
          is_premium: true,
          updated_at: new Date().toISOString()
        }).eq('id', finalUserId);

        // Registra evento de compra no app_events para histórico e métricas (com deduplicação)
        const { data: existingEv } = await admin
          .from('app_events')
          .select('id')
          .eq('event_name', 'purchase')
          .contains('metadata', { payment_id: payment.id })
          .limit(1)
          .maybeSingle();

        if (!existingEv) {
          const purchaseEvents: any[] = [{
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
          }];

          if (payment.billingType === 'PIX') {
            purchaseEvents.push({
              user_id: finalUserId,
              email: payment?.customerEmail ?? null,
              event_name: 'checkout_pix_pago',
              metadata: {
                plano: effectivePlan,
                value: payment.value || 0,
                currency: 'BRL',
                source: 'asaas',
                payment_id: payment.id,
                billingType: 'PIX'
              }
            });
          }

          await admin.from('app_events').insert(purchaseEvents);
        }
      } else if (cortarAgora) {
        await admin.from('profiles').update({
          is_premium: false,
          updated_at: new Date().toISOString()
        }).eq('id', finalUserId);
      }
      // Sincroniza imediatamente o plano no Horus (WhatsApp)
      try {
        await syncHorusSubscriptionStatus(admin, {
          userId: finalUserId,
          isPremium: !cortarAgora && (pago || legacy.status === 'active'),
          plano: effectivePlan,
          expiresAt: vitalicio ? null : (proximo ?? legacy.expires_at),
          notifyWhatsapp: false, // O recibo abaixo já faz a notificação via WhatsApp
        });
      } catch (e) {
        console.warn('syncHorusSubscriptionStatus error in asaas-webhook:', e);
      }
    }

    // Envio de confirmação via WhatsApp para o cliente e para o Administrador (+5511991897603)
    if (pago && finalUserId) {
      try {
        const { data: profile } = await admin.from('profiles')
          .select('display_name, telefone, whatsapp_number, email')
          .eq('id', finalUserId)
          .maybeSingle();

        let phone = profile?.whatsapp_number || profile?.telefone;
        // Fallback: se o perfil ainda não possuía telefone, tenta extrair do payload do Asaas
        if (!phone && (payment?.mobilePhone || payment?.phone || body?.customer?.mobilePhone || body?.customer?.phone)) {
          const rawPh = payment?.mobilePhone || payment?.phone || body?.customer?.mobilePhone || body?.customer?.phone;
          const cleanPh = String(rawPh).replace(/\D/g, '');
          if (cleanPh.length >= 10) {
            phone = cleanPh.startsWith('55') ? cleanPh : `55${cleanPh}`;
            await admin.from('profiles').update({
              telefone: cleanPh,
              whatsapp_number: phone,
              updated_at: new Date().toISOString()
            }).eq('id', finalUserId);
          }
        }

        const nome = profile?.display_name?.split(' ')[0] || 'Assinante';
        const valor = payment.value ? `R$ ${Number(payment.value).toFixed(2).replace('.', ',')}` : '';
        const planoLabel = (effectivePlan === 'anual' || effectivePlan === 'anual_promocional') ? 'Anual' : effectivePlan === 'vitalicio' ? 'Vitalício' : 'Mensal';
        const userEmail = payment?.customerEmail || profile?.email || 'E-mail não informado';

        // 1. Mensagem de confirmação para o Cliente
        if (phone) {
          const msg = `${nome}, seu pagamento${valor ? ` de ${valor}` : ''} do plano *${planoLabel}* foi confirmado! ✅\n\nSeu acesso ao *Direito Prime* está ativo. Bons estudos! 📚\n\nAcesse: https://app.suportedireitoprimeoficial.com`;
          await evolution.sendText(phone, msg).catch(err => console.warn('Falha envio recibo cliente:', err));
        }

        // 2. Alerta imediato de venda para o WhatsApp do Administrador (+5511991897603)
        const ADMIN_PHONE = Deno.env.get('ADMIN_PHONE') || '+5511991897603';
        const clienteNomeCompleto = profile?.display_name || userEmail.split('@')[0];
        const msgAdmin = `🔔 *NOVA ASSINATURA CONFIRMADA!* 💰🦉\n\n👤 *Cliente:* ${clienteNomeCompleto}\n📧 *E-mail:* ${userEmail}\n💎 *Plano:* ${planoLabel}\n💵 *Valor:* ${valor}\n⚡ *Método:* ${payment.billingType || 'PIX'} (Asaas)\n\nSincronizado e liberado com sucesso!`;
        await evolution.sendText(ADMIN_PHONE, msgAdmin).catch(err => console.warn('Falha envio alerta admin:', err));
      } catch (e) {
        console.warn('WhatsApp notification failed:', String((e as Error)?.message || e).slice(0, 200));
      }
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
