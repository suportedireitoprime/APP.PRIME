import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const automation_key = "push-aleatorio-video";
    
    // Anti-duplicidade / Cooldown: se já houve disparo recente nos últimos 45min (ex: boletim das 18h), não dispara videoaula no mesmo minuto
    const fortyFiveMinAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("push_campaigns")
      .select("id")
      .gte("created_at", fortyFiveMinAgo)
      .neq("automation_key", automation_key)
      .limit(1);

    if (recent && recent.length > 0) {
      console.log("[push-aleatorio-video] Já houve outro push recente nos últimos 45min. Abortando para evitar duplicidade.");
      return json({ ok: true, skipped: "cooldown_recente" });
    }

    // Fallback if no specific video table is found
    const title = `📺 Fim de Tarde de Foco: Sua videoaula recomendada de hoje`;
    const body = `Assista agora a esta aula estratégica e garanta mais uma etapa vencida no dia.`;
    const url = `/aprender`;

    const { data: campaign } = await admin
      .from("push_campaigns")
      .insert({
        title,
        body,
        url,
        audience: { all: true, target: "all", include_admins: true },
        status: "sending",
        tipo: "video",
        automation_key,
      })
      .select("id")
      .single();

    await admin.functions.invoke("send-push", {
      body: {
        campaign_id: campaign?.id,
        title,
        body,
        url,
        audience: { all: true, target: "all", include_admins: true },
        personalize: true,
      },
    });

    const canal = { espelhado_por: "send-push" };

    return json({ ok: true, canal });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
