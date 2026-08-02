// Devolve as legendas de um vídeo do YouTube com marcação de tempo.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { fetchYoutubeTranscriptSegments } from "../_shared/videoaulaIa.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const videoId = body?.videoId ? String(body.videoId).slice(0, 24) : "";
    if (!/^[\w-]{6,24}$/.test(videoId)) {
      return new Response(JSON.stringify({ error: "videoId inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const segments = await fetchYoutubeTranscriptSegments(videoId);
    console.log(`[buscar-transcricao-youtube] ${videoId}: ${segments.length} segmentos`);

    return new Response(JSON.stringify({ segments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[buscar-transcricao-youtube]", e);
    return new Response(JSON.stringify({ error: (e as Error)?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
