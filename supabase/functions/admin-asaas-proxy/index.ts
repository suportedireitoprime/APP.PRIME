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
      throw new Error('No authorization header');
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const token = authHeader.replace('Bearer ', '').trim();
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (token !== serviceKey) {
      const { data: { user }, error: authErr } = await admin.auth.getUser(token);
      if (authErr || !user) {
        throw new Error('Unauthorized');
      }
    }

    const asaasKey = Deno.env.get('ASAAS_API_KEY') || Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const baseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    if (!asaasKey) {
      throw new Error('ASAAS_API_KEY not configured in Edge Functions');
    }

    const body = await req.json().catch(() => ({}));

    // Modo Overview: busca assinaturas, pagamentos e clientes em paralelo
    if (body.action === 'overview') {
      const headers = { 'access_token': asaasKey };
      const [subsRes, paysRes, custsRes] = await Promise.all([
        fetch(`${baseUrl}/subscriptions?limit=100`, { headers }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`${baseUrl}/payments?limit=100`, { headers }).then((r) => r.json()).catch(() => ({ data: [] })),
        fetch(`${baseUrl}/customers?limit=100`, { headers }).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      return new Response(JSON.stringify({
        subscriptions: subsRes?.data || [],
        payments: paysRes?.data || [],
        customers: custsRes?.data || [],
        totalSubscriptions: subsRes?.totalCount ?? subsRes?.data?.length ?? 0,
        totalPayments: paysRes?.totalCount ?? paysRes?.data?.length ?? 0,
        totalCustomers: custsRes?.totalCount ?? custsRes?.data?.length ?? 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Modo Endpoint Individual
    const endpoint = body.endpoint || 'subscriptions';
    const params = body.params ? new URLSearchParams(body.params).toString() : '';
    const url = params ? `${baseUrl}/${endpoint}?${params}` : `${baseUrl}/${endpoint}`;
    const method = (body.method || 'GET').toUpperCase();

    const asaasRes = await fetch(url, {
      method,
      headers: {
        'access_token': asaasKey,
        ...(body.data ? { 'Content-Type': 'application/json' } : {})
      },
      body: body.data ? JSON.stringify(body.data) : undefined,
    });

    const json = await asaasRes.json();
    return new Response(JSON.stringify(json), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
