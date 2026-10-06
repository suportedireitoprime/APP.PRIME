import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: d1, error: e1 } = await supabase.from('dicionario_juridico').select('*').limit(1);
  const { data: d2, error: e2 } = await supabase.from('push_events').select('*').limit(1);
  return new Response(JSON.stringify({ dicionario: { d1, e1 }, push_events: { d2, e2 } }), { headers: { "Content-Type": "application/json" } });
});
