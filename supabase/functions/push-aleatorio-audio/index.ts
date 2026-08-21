import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const automation_key = "push-aleatorio-audio";
    
    const { data: allIds } = await admin.from("audioaulas_itens").select("id");
    if (!allIds || allIds.length === 0) {
      return json({ ok: true, skipped: true, reason: "No audioaulas found" });
    }

    const randomId = allIds[Math.floor(Math.random() * allIds.length)].id;

    const { data: item } = await admin
      .from("audioaulas_itens")
      .select("id, titulo, curso_id, audioaulas_cursos(titulo)")
      .eq("id", randomId)
      .single();

    if (!item) {
      return json({ ok: true, skipped: true, reason: "Audioaula not found after random select" });
    }

    const cursoTitulo = (item.audioaulas_cursos as any)?.titulo || "Curso Especial";
    const title = `🎧 Coloque o fone de ouvido: Uma audioaula surpresa para sua tarde`;
    const body = `Revisão de ${cursoTitulo}: ${item.titulo}. Aproveite para revisar enquanto faz outras atividades.`;
    const url = `/aprender`;

    const { data: campaign } = await admin
      .from("push_campaigns")
      .insert({
        title,
        body,
        url,
        audience: { all: true },
        status: "sending",
        tipo: "audio",
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

    return json({ ok: true, audioaula_id: item.id, canal });
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
