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

    // Enrich with profile created_at and last_sign_in_at
    const userIds = [...new Set((funnelData ?? []).map((e) => e.user_id).filter(Boolean))];
    const profileCreatedMap = new Map<string, string>();
    const lastSignInMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, created_at')
        .in('id', userIds);
      (profiles ?? []).forEach((p: { id: string; created_at: string }) => {
        profileCreatedMap.set(p.id, p.created_at);
      });

      // Fetch last_sign_in_at from auth (batched)
      const chunkSize = 10;
      for (let i = 0; i < userIds.length; i += chunkSize) {
        const chunk = userIds.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (id) => {
          try {
            const { data } = await admin.auth.admin.getUserById(id);
            if (data?.user?.last_sign_in_at) {
              lastSignInMap.set(id, data.user.last_sign_in_at);
            }
          } catch { /* ignore */ }
        }));
      }
    }

    const enriched = (funnelData ?? []).map((ev) => ({
      ...ev,
      profile_created_at: ev.user_id ? profileCreatedMap.get(ev.user_id) ?? null : null,
      last_sign_in_at: ev.user_id ? lastSignInMap.get(ev.user_id) ?? null : null,
    }));

    return new Response(JSON.stringify({ funnel: enriched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};
