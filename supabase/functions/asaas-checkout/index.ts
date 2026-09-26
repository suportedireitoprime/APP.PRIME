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
    const { plan, email, name, cpfCnpj, creditCard, creditCardHolderInfo, phone, installmentCount } = body; 
    // plan: 'mensal' | 'vitalicio' | 'vitalicio_pix' | 'anual' | 'anual_pix' | 'promocao'

    const VALID_PLANS = ['mensal', 'vitalicio', 'vitalicio_pix', 'anual', 'anual_pix', 'anual_regular_pix', 'promocao'];
    if (!VALID_PLANS.includes(plan)) {
      throw new Error('Plano inválido');
    }

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

    // 1. Check or Create Customer
    let customerId = '';
    const userEmail = (email || user.email || '').trim().toLowerCase();
    const finalCpfCnpj = cpfCnpj || creditCardHolderInfo?.cpfCnpj;
    let searchRes = await asaasRequest(`/customers?email=${encodeURIComponent(userEmail)}`, 'GET');
    
    // Item 49: Fallback — se não encontrou por email, tenta por CPF sanitizado
    if ((!searchRes.data || searchRes.data.length === 0) && finalCpfCnpj) {
      const sanitizedCpf = String(finalCpfCnpj).replace(/\D/g, '');
      if (sanitizedCpf.length >= 11) {
        searchRes = await asaasRequest(`/customers?cpfCnpj=${encodeURIComponent(sanitizedCpf)}`, 'GET');
      }
    }

    if (searchRes.data && searchRes.data.length > 0) {
      customerId = searchRes.data[0].id;
      // Optionally update customer if CPF is provided now but was missing
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
    const today = new Date().toISOString().split('T')[0];

    const isCreditCard = !!creditCard;
    const isVitalicio = plan === 'vitalicio' || plan === 'vitalicio_pix';
    const isPixPlan = plan === 'vitalicio_pix' || plan === 'anual_pix' || plan === 'anual_regular_pix' || plan === 'promocao';
    const billingType = isPixPlan ? 'PIX' : (isCreditCard ? 'CREDIT_CARD' : 'UNDEFINED');
    const isInstallment = installmentCount && installmentCount > 1;
    
    let sub: any;

    if (isVitalicio || isInstallment) {
      // Cobrança avulsa / parcelada via /payments (sem recorrência anual para Vitalício)
      let baseValue = 199.90;
      if (plan === 'vitalicio_pix' || plan === 'anual_pix' || plan === 'promocao') {
        baseValue = 149.90;
      }

      let totalWithTax = baseValue;
      const num = installmentCount || 1;

      if (isCreditCard) {
        let taxRate = 0;
        if (num === 1) taxRate = 0.0339;
        else if (num <= 6) taxRate = 0.0389;
        else taxRate = 0.0439;
        
        totalWithTax = Number(((baseValue + 0.29) / (1 - taxRate)).toFixed(2));
      }
      
      const isPromo = plan === 'vitalicio_pix' || plan === 'anual_pix' || plan === 'promocao';
      const paymentPayload: any = {
        customer: customerId,
        billingType: billingType,
        dueDate: today,
        description: isPromo
          ? `Anual Estudos Jurídicos Promoção${num > 1 ? ` (Parcelado em ${num}x)` : ''}`
          : `Anual Estudos Jurídicos${num > 1 ? ` (Parcelado em ${num}x)` : ''}`,
      };

      if (num > 1) {
        paymentPayload.installmentCount = num;
        paymentPayload.totalValue = totalWithTax;
      } else {
        paymentPayload.value = totalWithTax;
      }
      paymentPayload.externalReference = user.id;

      if (isCreditCard) {
        paymentPayload.creditCard = creditCard;
        paymentPayload.creditCardHolderInfo = creditCardHolderInfo;
      }

      sub = await asaasRequest('/payments', 'POST', paymentPayload);
      invoiceUrl = sub.invoiceUrl;
    } else {
      const subPayload: any = {
        customer: customerId,
        billingType: billingType,
        nextDueDate: today,
        externalReference: user.id
      };

      if (plan === 'mensal') {
        subPayload.value = 29.90;
        subPayload.cycle = 'MONTHLY';
        subPayload.description = 'Mensal Estudos Jurídicos';
      } else if (plan === 'anual' || plan === 'anual_regular_pix') {
        subPayload.value = 199.90;
        subPayload.cycle = 'YEARLY';
        subPayload.description = 'Anual Estudos Jurídicos';
      } else if (plan === 'anual_pix' || plan === 'promocao') {
        subPayload.value = 149.90;
        subPayload.cycle = 'YEARLY';
        subPayload.description = 'Promoção Estudos Jurídicos';
      }

      if (isCreditCard) {
        subPayload.creditCard = creditCard;
        subPayload.creditCardHolderInfo = creditCardHolderInfo;
      }

      sub = await asaasRequest('/subscriptions', 'POST', subPayload);
      invoiceUrl = sub.invoiceUrl;
    }

    if (!invoiceUrl || isPixPlan || billingType === 'PIX') {
      const isDirectPayment = isVitalicio || isInstallment || sub?.object === 'payment';
      if (!isDirectPayment && sub?.id?.startsWith('sub_')) {
        let payRes = await asaasRequest(`/subscriptions/${sub.id}/payments`, 'GET');
        let retries = 0;
        while ((!payRes.data || payRes.data.length === 0) && retries < 4) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          payRes = await asaasRequest(`/subscriptions/${sub.id}/payments`, 'GET');
          retries++;
        }

        if (payRes.data && payRes.data.length > 0) {
          const payment = payRes.data[0];
          invoiceUrl = invoiceUrl || payment.invoiceUrl;
          
          if (billingType === 'PIX') {
            const qrCodeRes = await asaasRequest(`/payments/${payment.id}/pixQrCode`, 'GET');
            pixQrCode = qrCodeRes.encodedImage;
            pixCopyPaste = qrCodeRes.payload;
          }
        }
      } else {
        // Pagamento avulso / parcelado direto
        if (billingType === 'PIX' && sub?.id) {
          const qrCodeRes = await asaasRequest(`/payments/${sub.id}/pixQrCode`, 'GET');
          pixQrCode = qrCodeRes.encodedImage;
          pixCopyPaste = qrCodeRes.payload;
        }
      }
    }

    // Se o pagamento no cartão foi aprovado instantaneamente pelo Asaas, ativa no banco a 0ms
    const isApproved = ['ACTIVE', 'CONFIRMED', 'RECEIVED', 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(sub?.status);
    if (isApproved) {
      try {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const isAnualPlan = plan === 'anual' || plan === 'anual_pix' || plan === 'anual_regular_pix' || plan === 'promocao' || plan === 'vitalicio' || plan === 'vitalicio_pix';
        const planoFinal = plan === 'mensal' ? 'mensal' : (plan === 'promocao' ? 'anual_promocional' : 'anual');
        const diasCiclo = isAnualPlan ? 370 : 34;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + diasCiclo * 24 * 3600 * 1000).toISOString();

        // 1. Atualiza asaas_subscriptions imediatamente
        await admin.from('asaas_subscriptions').upsert({
          user_id: user.id,
          plano: planoFinal,
          status: 'ACTIVE',
          asaas_customer_id: customerId,
          asaas_subscription_id: sub.id,
          started_at: now.toISOString(),
          expires_at: expiresAt,
          origem: 'asaas',
          updated_at: now.toISOString(),
        }, { onConflict: 'user_id' });

        // 2. Atualiza profiles para liberar 100% das funções imediatamente
        await admin.from('profiles').update({
          is_premium: true,
          updated_at: now.toISOString(),
        }).eq('id', user.id);

        // 3. Atualiza legacy_subscribers se existir correspondência para este usuário
        await admin.from('legacy_subscribers').update({
          tipo: planoFinal,
          status: 'active',
          expires_at: expiresAt,
          claimed_user_id: user.id,
          claimed_at: now.toISOString(),
        }).or(`claimed_user_id.eq.${user.id},email.ilike.${userEmail},asaas_customer_id.eq.${customerId}`);

        // 4. Registra evento de compra no app_events
        await admin.from('app_events').insert({
          user_id: user.id,
          email: userEmail,
          event_name: 'purchase',
          metadata: {
            plano: planoFinal,
            value: sub.value || (isAnualPlan ? 199.90 : 29.90),
            currency: 'BRL',
            source: 'asaas_checkout_direct',
            payment_id: sub.id,
            billingType: billingType,
          }
        });
      } catch (dbErr) {
        console.warn('Persistência direta pós-checkout falhou (webhook cuidará):', dbErr);
      }
    }

    return new Response(JSON.stringify({ 
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
      status: 200, // Returning 200 to let the client parse the error body gracefully
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
