import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const admin = createClient(supabaseUrl, supabaseKey);

    const { days } = await req.json().catch(() => ({})) || {};

    let query = admin
      .from('app_events')
      .select('event_name, email, created_at, user_id, metadata')
      .in('event_name', ['assinatura_aberta', 'trial_click', 'start_trial', 'purchase']);
      
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days, 10));
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: funnelData, error } = await query
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error) throw error;

    return new Response(JSON.stringify({ funnel: funnelData ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};
