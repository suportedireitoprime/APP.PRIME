import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 15), 30); // batch seguro para timeout do Deno

    // Contar total que ainda falta migrar
    const { count: restantes } = await admin
      .from("audioaulas_acervo")
      .select("id", { count: "exact", head: true })
      .ilike("area", "%ECA%")
      .not("url_audio", "like", "%/storage/v1/object/public/audios/%");

    // Buscar as próximas aulas pendentes de migração
    const { data: aulas, error: qErr } = await admin
      .from("audioaulas_acervo")
      .select("id, titulo, sequencia, url_audio")
      .ilike("area", "%ECA%")
      .not("url_audio", "like", "%/storage/v1/object/public/audios/%")
      .order("id", { ascending: true })
      .limit(limit);

    if (qErr) throw qErr;

    const resultados = [];

    for (const aula of (aulas || [])) {
      if (!aula.url_audio) continue;

      const m = aula.url_audio.match(/id=([a-zA-Z0-9_-]{20,})/);
      if (!m) continue;

      const fileId = m[1];
      const storagePath = `audioaulas/eca/eca_art_${aula.id}_seq_${aula.sequencia || 0}.mp3`;

      try {
        const driveDownloadUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
        const res = await fetch(driveDownloadUrl);
        if (!res.ok) {
          resultados.push({ id: aula.id, status: "erro_download", code: res.status });
          continue;
        }

        const arrayBuf = await res.arrayBuffer();
        const blob = new Uint8Array(arrayBuf);

        const { error: upErr } = await admin.storage
          .from("audios")
          .upload(storagePath, blob, {
            contentType: "audio/mpeg",
            upsert: true,
          });

        if (upErr) {
          resultados.push({ id: aula.id, status: "erro_upload", error: upErr.message });
          continue;
        }

        const { data: pubData } = admin.storage.from("audios").getPublicUrl(storagePath);
        const publicUrl = pubData.publicUrl;

        await admin
          .from("audioaulas_acervo")
          .update({ url_audio: publicUrl })
          .eq("id", aula.id);

        resultados.push({ id: aula.id, status: "migrado" });
      } catch (err) {
        resultados.push({ id: aula.id, status: "excecao", error: String(err) });
      }
    }

    return json({
      ok: true,
      migrados_nesta_rodada: resultados.filter((r) => r.status === "migrado").length,
      erros: resultados.filter((r) => r.status !== "migrado").length,
      restantes_estimados: (restantes || 0) - resultados.filter((r) => r.status === "migrado").length,
    });
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
