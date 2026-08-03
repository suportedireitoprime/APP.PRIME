// Modo Aula — transcreve UM segmento de áudio da aula.
// POST { aulaId, midiaId } → { texto, duracaoSeg }
//
// O cliente grava a aula em segmentos de ~5 min e chama esta função uma vez por
// segmento, o que evita os limites de tamanho/duração do modelo e permite mostrar
// progresso real ("3 de 18").

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function extDoMime(mime: string): string {
  const m = (mime || "").toLowerCase();
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("mp4") || m.includes("m4a")) return "m4a";
  if (m.includes("aac")) return "aac";
  if (m.includes("webm")) return "webm";
  if (m.includes("ogg")) return "ogg";
  return "m4a";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY ausente" }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "não autenticado" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: "não autenticado" }, 401);

    const body = await req.json().catch(() => ({}));
    const aulaId = String(body?.aulaId ?? "");
    const midiaId = String(body?.midiaId ?? "");
    const language = typeof body?.language === "string" ? body.language : "pt";
    if (!aulaId || !midiaId) return json({ error: "aulaId e midiaId são obrigatórios" }, 400);

    const { data: midia, error: midiaErr } = await admin
      .from("aula_midias")
      .select("id, aula_id, user_id, tipo, storage_path, mime, duracao_seg, texto")
      .eq("id", midiaId)
      .eq("aula_id", aulaId)
      .maybeSingle();

    if (midiaErr) return json({ error: midiaErr.message }, 400);
    if (!midia) return json({ error: "segmento não encontrado" }, 404);
    if (midia.user_id !== user.id) return json({ error: "sem permissão" }, 403);
    if (midia.tipo !== "audio" || !midia.storage_path) return json({ error: "segmento sem áudio" }, 400);

    // Já transcrito antes? devolve o cache (idempotente, não cobra duas vezes).
    if (midia.texto && midia.texto.trim().length > 0) {
      return json({ texto: midia.texto, duracaoSeg: midia.duracao_seg ?? 0, cache: true });
    }

    const { data: arquivo, error: dlErr } = await admin.storage
      .from("modo-aula")
      .download(midia.storage_path);
    if (dlErr || !arquivo) return json({ error: `falha ao baixar áudio: ${dlErr?.message ?? "?"}` }, 400);

    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    if (bytes.byteLength < 2048) return json({ error: "segmento de áudio vazio" }, 400);
    if (bytes.byteLength > 24 * 1024 * 1024) return json({ error: "segmento de áudio muito grande" }, 413);

    const mime = midia.mime || arquivo.type || "audio/m4a";
    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", new Blob([bytes], { type: mime }), `segmento.${extDoMime(mime)}`);
    if (language) form.append("language", language);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: form,
    });

    if (!res.ok) {
      const detalhe = await res.text().catch(() => "");
      console.error(`transcrição falhou [${res.status}]: ${detalhe}`);
      return json({ error: "falha na transcrição", status: res.status, detalhe }, res.status);
    }

    const data = await res.json();
    const texto = String(data?.text ?? "").trim();

    await admin.from("aula_midias").update({ texto }).eq("id", midia.id);

    return json({ texto, duracaoSeg: midia.duracao_seg ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("aula-transcrever:", msg);
    return json({ error: msg }, 500);
  }
});
