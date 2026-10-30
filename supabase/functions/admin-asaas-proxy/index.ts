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
    
    const { data: { user }, error: authErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) throw new Error('Unauthorized');
    
    const body = await req.json();
    const endpoint = body.endpoint || 'subscriptions';
    const params = new URLSearchParams(body.params || {}).toString();

    const asaasKey = Deno.env.get('ASAAS_API_KEY') || Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const baseUrl = Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3';

    if (!asaasKey) {
      throw new Error('ASAAS_API_KEY not configured in Edge Functions');
    }

    const url = `${baseUrl}/${endpoint}?${params}`;
    const asaasRes = await fetch(url, {
      method: 'GET',
      headers: {
        'access_token': asaasKey,
      }
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
