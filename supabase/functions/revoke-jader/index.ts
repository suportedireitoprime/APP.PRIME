import postgres from "npm:postgres@3.4.4";
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
    
    console.log("Revogando Jader...");
    
    // Deleta o registro asaas_subscriptions do Jader
    await sql`
      DELETE FROM public.asaas_subscriptions
      WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = 'jader.galvaoo@gmail.com'
      );
    `;

    // Deleta o registro legacy_subscribers
    await sql`
      DELETE FROM public.legacy_subscribers
      WHERE email = 'jader.galvaoo@gmail.com';
    `;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
