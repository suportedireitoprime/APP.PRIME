// Edge Function: transcreve áudio via Gemini API (openai/gpt-4o-mini-transcribe).
// Aceita base64+mime OU um caminho no bucket privado `aulas-audio`.
//
// POST { audioBase64?, mimeType?, filePath?, language? } → { text: string }

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { transcribeAudio } from "../_shared/horusMedia.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audioBase64, mimeType, filePath } = await req.json();

    let base64: string = audioBase64 || "";
    let mime = mimeType || "audio/ogg";

    if (filePath) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data, error } = await supabase.storage.from("aulas-audio").download(filePath);
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Falha ao baixar arquivo: " + (error?.message ?? "?") }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const buffer = await data.arrayBuffer();
      base64 = encodeBase64(buffer);
      mime = data.type || mime;
    } else if (!audioBase64) {
      return new Response(JSON.stringify({ error: "audioBase64 ou filePath obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await transcribeAudio(base64, mime);

    return new Response(JSON.stringify({ text: text ?? "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
