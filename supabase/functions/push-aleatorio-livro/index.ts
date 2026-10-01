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
    let reqBody: any = {};
    try { reqBody = await req.clone().json(); } catch(e) {}
    const automation_key = reqBody.automation_key || "push-aleatorio-livro";
    
    const title = `📚 Hora da Leitura: Sugestão de Doutrina da Tarde`;
    const body = `Separamos algumas leituras essenciais. Abra a biblioteca e aproveite o horário para atualizar seus estudos!`;
    const url = `/biblioteca`;

    const { data: campaign } = await admin
      .from("push_campaigns")
      .insert({
        title,
        body,
        url,
        audience: { all: true },
        status: "sending",
        tipo: "livro",
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
