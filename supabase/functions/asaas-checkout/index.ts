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
    // plan: 'mensal' | 'anual' | 'anual_pix'

    if (!['mensal', 'anual', 'anual_pix'].includes(plan)) {
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
    const userEmail = email || user.email;
    const finalCpfCnpj = cpfCnpj || creditCardHolderInfo?.cpfCnpj;
    const searchRes = await asaasRequest(`/customers?email=${encodeURIComponent(userEmail)}`, 'GET');
    
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
    const billingType = plan === 'anual_pix' ? 'PIX' : (isCreditCard ? 'CREDIT_CARD' : 'UNDEFINED');
    const isInstallment = installmentCount && installmentCount > 1 && plan === 'anual';
    
    let sub: any;

    if (isInstallment || (plan === 'anual' && isCreditCard)) {
      // Calculation of the total amount including Asaas credit card tax repass
      let taxRate = 0;
      const num = installmentCount || 1;
      if (num === 1) taxRate = 0.0339;
      else if (num <= 6) taxRate = 0.0389;
      else taxRate = 0.0439;
      
      const totalWithTax = (199.90 + 0.29) / (1 - taxRate);
      
      const paymentPayload: any = {
        customer: customerId,
        billingType: billingType,
        dueDate: today,
        description: `Anual Estudos Jurídicos${num > 1 ? ` (Parcelado em ${num}x)` : ''}`,
      };

      if (num > 1) {
        paymentPayload.installmentCount = num;
        paymentPayload.totalValue = Number(totalWithTax.toFixed(2));
      } else {
        paymentPayload.value = Number(totalWithTax.toFixed(2));
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
      } else if (plan === 'anual') {
        subPayload.value = 199.90;
        subPayload.cycle = 'YEARLY';
        subPayload.description = 'Anual Estudos Jurídicos';
      } else if (plan === 'anual_pix') {
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

    if (!invoiceUrl || plan === 'anual_pix') {
      if (!isInstallment) {
        const payRes = await asaasRequest(`/subscriptions/${sub.id}/payments`, 'GET');
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
        // se for payment avulso PIX
        if (billingType === 'PIX') {
           const qrCodeRes = await asaasRequest(`/payments/${sub.id}/pixQrCode`, 'GET');
           pixQrCode = qrCodeRes.encodedImage;
           pixCopyPaste = qrCodeRes.payload;
        }
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
