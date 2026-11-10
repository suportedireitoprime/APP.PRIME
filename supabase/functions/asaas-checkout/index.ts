import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const body = await req.json();

    const apiKey = Deno.env.get('ASAAS_API_KEY') || Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    if (!apiKey) {
      throw new Error('API Key do Asaas não configurada');
    }

    const baseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    // Helper for Asaas requests
    const asaasRequest = async (endpoint: string, method: string, data?: any) => {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'access_token': apiKey
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('Asaas Error:', json);
        throw new Error(json.errors?.[0]?.description || 'Erro na API do Asaas');
      }
      return json;
    };

    // --- Action: check_status (Verificação Instantânea de PIX direto no Asaas) ---
    if (body.action === 'check_status') {
      const paymentId = body.paymentId;
      if (!paymentId) throw new Error('paymentId obrigatório para verificação');

      const payment = await asaasRequest(`/payments/${paymentId}`, 'GET');
      const isPaid = ['CONFIRMED', 'RECEIVED', 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status);

      if (isPaid) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const desc = (payment.description || '').toLowerCase();
        let planFinal = 'anual';
        if (desc.includes('mensal')) planFinal = 'mensal';
        else if (desc.includes('vitalicio') || desc.includes('vitalício')) planFinal = 'vitalicio';

        const isVitalicio = planFinal === 'vitalicio';
        const isAnual = planFinal === 'anual';
        const diasCiclo = isAnual ? 370 : 34;
        const now = new Date();
        const expiresAt = isVitalicio ? null : new Date(now.getTime() + diasCiclo * 24 * 3600 * 1000).toISOString();

        await admin.from('asaas_subscriptions').upsert({
          user_id: user.id,
          plano: planFinal,
          status: 'ACTIVE',
          asaas_customer_id: payment.customer,
          asaas_subscription_id: payment.subscription || payment.id,
          started_at: now.toISOString(),
          expires_at: expiresAt,
          origem: 'asaas',
          updated_at: now.toISOString(),
        }, { onConflict: 'user_id' });

        await admin.from('profiles').update({
          is_premium: true,
          updated_at: now.toISOString(),
        }).eq('id', user.id);

        return new Response(JSON.stringify({ confirmed: true, status: payment.status }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ confirmed: false, status: payment.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Action: checkout regular (Criação de Cobrança / Assinatura) ---
    const { plan, email, name, cpfCnpj, creditCard, creditCardHolderInfo, phone, installmentCount } = body; 

    const VALID_PLANS = ['mensal', 'mensal_pix', 'vitalicio', 'vitalicio_pix', 'anual', 'anual_pix', 'anual_regular_pix', 'promocao'];
    if (!VALID_PLANS.includes(plan)) {
      throw new Error('Plano inválido');
    }

    if (plan === 'promocao' || plan === 'anual_pix') {
      const isNewUser = !!(user.created_at && (Date.now() - new Date(user.created_at).getTime() < 24 * 60 * 60 * 1000));
      if (!isNewUser) {
        throw new Error('Promoção expirada');
      }
    }

    // 1. Check or Create Customer
    let customerId = '';
    const userEmail = (email || user.email || '').trim().toLowerCase();
    const finalCpfCnpj = cpfCnpj || creditCardHolderInfo?.cpfCnpj;
    let searchRes = await asaasRequest(`/customers?email=${encodeURIComponent(userEmail)}`, 'GET');
    
    // Fallback: busca por CPF
    if ((!searchRes.data || searchRes.data.length === 0) && finalCpfCnpj) {
      const sanitizedCpf = String(finalCpfCnpj).replace(/\D/g, '');
      if (sanitizedCpf.length >= 11) {
        searchRes = await asaasRequest(`/customers?cpfCnpj=${encodeURIComponent(sanitizedCpf)}`, 'GET');
      }
    }

    if (searchRes.data && searchRes.data.length > 0) {
      customerId = searchRes.data[0].id;
      if (finalCpfCnpj && !searchRes.data[0].cpfCnpj) {
        await asaasRequest(`/customers/${customerId}`, 'POST', { cpfCnpj: finalCpfCnpj });
      }
    } else {
      const newCustomer = await asaasRequest('/customers', 'POST', {
        name: name || creditCardHolderInfo?.name || 'Usuário Prime',
        email: userEmail,
        cpfCnpj: finalCpfCnpj || undefined,
        phone: phone || creditCardHolderInfo?.phone || undefined,
        externalReference: user.id
      });
      customerId = newCustomer.id;
    }

    // 2. Create Charge or Subscription
    let invoiceUrl = '';
    let pixQrCode = '';
    let pixCopyPaste = '';
    let paymentId = '';
    const today = new Date().toISOString().split('T')[0];

    const isCreditCard = !!creditCard;
    const isVitalicio = plan === 'vitalicio' || plan === 'vitalicio_pix';
    const isPixPlan = plan === 'vitalicio_pix' || plan === 'anual_pix' || plan === 'anual_regular_pix' || plan === 'mensal_pix' || plan === 'promocao';
    const billingType = isPixPlan ? 'PIX' : (isCreditCard ? 'CREDIT_CARD' : 'UNDEFINED');
    const isInstallment = installmentCount && installmentCount > 1;
    
    let sub: any;

    // TODOS os pagamentos via PIX ou compras avulsas/parceladas vão para /payments
    if (isPixPlan || isVitalicio || isInstallment) {
      // Preços oficiais: Vitalício = R$ 149,90, Anual = R$ 89,90, Mensal = R$ 19,90
      let baseValue = 89.90;
      let maxInstallments = 1;
      let planDescription = 'Direito Prime Anual';

      if (plan === 'vitalicio' || plan === 'vitalicio_pix') {
        baseValue = 149.90;
        maxInstallments = 6;
        planDescription = 'Direito Prime Vitalício';
      } else if (plan === 'mensal' || plan === 'mensal_pix') {
        baseValue = 19.90;
        maxInstallments = 1;
        planDescription = 'Direito Prime Mensal';
      } else if (plan === 'anual' || plan === 'anual_pix' || plan === 'anual_regular_pix' || plan === 'promocao') {
        baseValue = 89.90;
        maxInstallments = 6;
        planDescription = 'Direito Prime Anual';
      }

      const rawNum = installmentCount || 1;
      const num = Math.min(Math.max(1, rawNum), maxInstallments);
      let totalWithTax = baseValue;

      if (isCreditCard && num > 1) {
        // Juros Asaas repassados
        const rates: Record<number, number> = {
          2: 0.058,
          3: 0.083,
          4: 0.108,
          5: 0.133,
          6: 0.158,
        };
        const rate = rates[num] ?? (0.0349 + num * 0.0249);
        totalWithTax = Number((baseValue * (1 + rate)).toFixed(2));
      }

      const paymentPayload: any = {
        customer: customerId,
        billingType: billingType,
        dueDate: today,
        description: isPixPlan 
          ? `${planDescription} PIX` 
          : `${planDescription}${num > 1 ? ` (${num}x)` : ''}`,
        externalReference: `${user.id}|${plan}`,
      };

      if (num > 1) {
        paymentPayload.installmentCount = num;
        paymentPayload.totalValue = totalWithTax;
      } else {
        paymentPayload.value = totalWithTax;
      }

      if (isCreditCard) {
        paymentPayload.creditCard = creditCard;
        paymentPayload.creditCardHolderInfo = creditCardHolderInfo;
      }

      sub = await asaasRequest('/payments', 'POST', paymentPayload);
      paymentId = sub.id;
      invoiceUrl = sub.invoiceUrl;

      // Se for PIX, busca QR code imediatamente
      if (billingType === 'PIX' && sub?.id) {
        const qrCodeRes = await asaasRequest(`/payments/${sub.id}/pixQrCode`, 'GET');
        pixQrCode = qrCodeRes.encodedImage;
        pixCopyPaste = qrCodeRes.payload;
      }
    } else {
      // Assinatura com cartão recorrente mensal
      const subPayload: any = {
        customer: customerId,
        billingType: 'CREDIT_CARD',
        nextDueDate: today,
        externalReference: `${user.id}|${plan}`
      };

      if (plan === 'mensal') {
        subPayload.value = 19.90;
        subPayload.cycle = 'MONTHLY';
        subPayload.description = 'Direito Prime Mensal';
      } else {
        subPayload.value = 89.90;
        subPayload.cycle = 'YEARLY';
        subPayload.description = 'Direito Prime Anual';
      }

      if (isCreditCard) {
        subPayload.creditCard = creditCard;
        subPayload.creditCardHolderInfo = creditCardHolderInfo;
      }

      sub = await asaasRequest('/subscriptions', 'POST', subPayload);
      paymentId = sub.id;
      invoiceUrl = sub.invoiceUrl;
    }

    // Registra registro PENDING em asaas_subscriptions para que o Realtime listener acompanhe
    // Importante: NÃO rebaixa usuários que já possuem assinatura ACTIVE
    try {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      const { data: existingSub } = await admin
        .from('asaas_subscriptions')
        .select('status, plano')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAlreadyActive = existingSub && ['ACTIVE', 'ACTIVE_GRACE', 'active'].includes(existingSub.status);
      const isAlreadyVitalicio = existingSub?.plano === 'vitalicio';

      if (!isAlreadyActive && !isAlreadyVitalicio) {
        const planoFinal = (plan === 'mensal' || plan === 'mensal_pix') 
          ? 'mensal' 
          : (plan === 'vitalicio' || plan === 'vitalicio_pix' ? 'vitalicio' : 'anual');

        await admin.from('asaas_subscriptions').upsert({
          user_id: user.id,
          plano: planoFinal,
          status: 'PENDING',
          asaas_customer_id: customerId,
          asaas_subscription_id: paymentId || sub.id,
          origem: 'asaas',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    } catch (e) {
      console.warn('Pending subscription upsert warning:', e);
    }

    // Se o pagamento no cartão foi aprovado instantaneamente pelo Asaas, ativa no banco a 0ms
    const isApproved = ['CONFIRMED', 'RECEIVED', 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(sub?.status);
    if (isApproved) {
      try {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const isAnualPlan = plan === 'anual' || plan === 'anual_pix' || plan === 'anual_regular_pix' || plan === 'promocao' || plan === 'vitalicio' || plan === 'vitalicio_pix';
        const planoFinal = (plan === 'mensal' || plan === 'mensal_pix') ? 'mensal' : (plan === 'vitalicio' || plan === 'vitalicio_pix' ? 'vitalicio' : 'anual');
        const diasCiclo = isAnualPlan ? 370 : 34;
        const now = new Date();
        const expiresAt = isVitalicio ? null : new Date(now.getTime() + diasCiclo * 24 * 3600 * 1000).toISOString();

        await admin.from('asaas_subscriptions').upsert({
          user_id: user.id,
          plano: planoFinal,
          status: 'ACTIVE',
          asaas_customer_id: customerId,
          asaas_subscription_id: paymentId || sub.id,
          started_at: now.toISOString(),
          expires_at: expiresAt,
          origem: 'asaas',
          updated_at: now.toISOString(),
        }, { onConflict: 'user_id' });

        await admin.from('profiles').update({
          is_premium: true,
          updated_at: now.toISOString(),
        }).eq('id', user.id);

        await admin.from('app_events').insert({
          user_id: user.id,
          email: userEmail,
          event_name: 'purchase',
          metadata: {
            plano: planoFinal,
            value: sub.value || (isAnualPlan ? (isVitalicio ? 149.90 : 89.90) : 19.90),
            currency: 'BRL',
            source: 'asaas_checkout_direct',
            payment_id: paymentId || sub.id,
            billingType: billingType,
          }
        });
      } catch (dbErr) {
        console.warn('Persistência direta pós-checkout falhou (webhook cuidará):', dbErr);
      }
    }

    return new Response(JSON.stringify({ 
      paymentId: paymentId || sub.id,
      invoiceUrl, 
      pixQrCode, 
      pixCopyPaste,
      status: sub.status 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('asaas-checkout falhou:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
