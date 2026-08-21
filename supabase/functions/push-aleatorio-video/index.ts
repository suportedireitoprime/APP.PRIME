import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const automation_key = "push-aleatorio-video";
    
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
        audience: { all: true },
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
        audience: { all: true },
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
