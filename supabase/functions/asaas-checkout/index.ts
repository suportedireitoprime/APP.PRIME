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
    const { plan, email, name, cpfCnpj } = body; // plan: 'mensal' | 'vitalicio'

    if (!['mensal', 'vitalicio'].includes(plan)) {
      throw new Error('Plano inválido');
    }

    const apiKey = Deno.env.get('ASAAS_API_KEY') || Deno.env.get('ASAAS_WEBHOOK_TOKEN');

    if (!apiKey) {
      throw new Error('API Key do Asaas não configurada');
    }

    // Identificar se a chave é de sandbox para direcionar a URL
    const isSandbox = apiKey.startsWith('$aact_YTU') ? false : true; 
    // '$aact_YTU...' é o padrão das chaves de produção antigas, e as novas podem variar. 
    // Idealmente, a URL deve ser via .env, mas vamos usar production por padrão.
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
    const searchRes = await asaasRequest(`/customers?email=${encodeURIComponent(userEmail)}`, 'GET');
    if (searchRes.data && searchRes.data.length > 0) {
      customerId = searchRes.data[0].id;
    } else {
      const newCustomer = await asaasRequest('/customers', 'POST', {
        name: name || 'Usuário Prime',
        email: userEmail,
        cpfCnpj: cpfCnpj || undefined,
      });
      customerId = newCustomer.id;
    }

    // 2. Create Charge or Subscription
    let invoiceUrl = '';
    const today = new Date().toISOString().split('T')[0];

    if (plan === 'mensal') {
      const sub = await asaasRequest('/subscriptions', 'POST', {
        customer: customerId,
        billingType: 'UNDEFINED',
        value: 29.90,
        nextDueDate: today,
        cycle: 'MONTHLY',
        description: 'Assinatura Mensal Estudos Jurídicos',
        externalReference: user.id
      });
      
      // Asaas subscriptions usually don't return invoiceUrl directly. We need to fetch the first payment.
      invoiceUrl = sub.invoiceUrl; 
      if (!invoiceUrl) {
        const payRes = await asaasRequest(`/subscriptions/${sub.id}/payments`, 'GET');
        if (payRes.data && payRes.data.length > 0) {
          invoiceUrl = payRes.data[0].invoiceUrl;
        }
      }
    } else if (plan === 'vitalicio') {
      const charge = await asaasRequest('/payments', 'POST', {
        customer: customerId,
        billingType: 'UNDEFINED',
        value: 199.90,
        dueDate: today,
        description: 'Acesso Vitalício Estudos Jurídicos',
        externalReference: user.id
      });
      invoiceUrl = charge.invoiceUrl;
    }

    return new Response(JSON.stringify({ invoiceUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('asaas-checkout falhou:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
