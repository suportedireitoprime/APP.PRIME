import postgres from "npm:postgres@3.4.4";
import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) throw new Error('SUPABASE_DB_URL not found');

    const sql = postgres(dbUrl);
    
    console.log("Executando UPDATE em legacy_subscribers...");
    await sql`
      UPDATE public.legacy_subscribers ls
      SET claimed_user_id = u.id
      FROM auth.users u
      WHERE lower(ls.email) = lower(u.email)
        AND ls.claimed_user_id IS NULL;
    `;
    
    console.log("Buscando assinantes recém-linkados ou que precisam de asaas_subscriptions...");
    
    const linked = await sql`
      SELECT ls.claimed_user_id as id, ls.email
      FROM public.legacy_subscribers ls
      WHERE ls.claimed_user_id IS NOT NULL 
        AND ls.status = 'active'
        AND NOT EXISTS (
          SELECT 1 FROM public.asaas_subscriptions a WHERE a.user_id = ls.claimed_user_id
        );
    `;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let claimed = 0;
    for (const row of linked) {
      const { data: result, error } = await admin.rpc('claim_legacy_subscription', {
        _user_id: row.id,
        _email: row.email
      });
      if (result) claimed++;
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      linkedCount: linked.length,
      claimedCount: claimed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
