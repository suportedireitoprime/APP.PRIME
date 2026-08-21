import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const automation_key = "push-aleatorio-blog";
    
    const { data: allIds } = await admin.from("blog_edicao_posts").select("id").eq("publicado", true);
    if (!allIds || allIds.length === 0) {
      return json({ ok: true, skipped: true, reason: "No posts found" });
    }

    const randomId = allIds[Math.floor(Math.random() * allIds.length)].id;

    const { data: post } = await admin
      .from("blog_edicao_posts")
      .select("id, titulo, resumo, headline_push")
      .eq("id", randomId)
      .single();

    if (!post) {
      return json({ ok: true, skipped: true, reason: "Post not found after random select" });
    }

    const title = post.headline_push || `✍️ Leitura de Meio-Dia: ${post.titulo}`;
    const body = post.resumo || "Aprofunde-se neste artigo selecionado para a sua pausa de descanso.";
    const url = `/blog/${post.id}`;

    const { data: campaign } = await admin
      .from("push_campaigns")
      .insert({
        title,
        body,
        url,
        audience: { all: true },
        status: "sending",
        tipo: "blog",
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

    return json({ ok: true, post_id: post.id, canal });
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
