import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: aulas, error } = await admin
      .from("audioaulas_acervo")
      .select("id, url_audio")
      .ilike("area", "%ECA%");

    if (error) throw error;
    let atualizados = 0;

    for (const a of (aulas || [])) {
      if (!a.url_audio) continue;
      // Extract file id
      const m = a.url_audio.match(/id=([a-zA-Z0-9_-]{20,})/);
      if (m) {
        const fileId = m[1];
        const novaUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view&authuser=0`;
        if (a.url_audio !== novaUrl) {
          await admin
            .from("audioaulas_acervo")
            .update({ url_audio: novaUrl })
            .eq("id", a.id);
          atualizados++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, total: aulas?.length, atualizados }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
