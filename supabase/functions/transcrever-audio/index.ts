import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { geminiFetch } from "../_shared/geminiFetch.ts";
import { logAiCall } from "../_shared/ai-log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "gemini-3.1-flash-lite";
const PRIMARY = Deno.env.get("GEMINI_API_KEY") ?? "";
const RESERVA = Deno.env.get("GEMINI_API_KEY_RESERVA") ?? "";
const API_KEY = PRIMARY || RESERVA;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let success = false;
  let errMsg = "";
  let inputUnits = 0;
  let outputUnits = 0;
  const startedAt = Date.now();

  try {
    const { fileUrl } = await req.json();

    if (!fileUrl) {
      return new Response(JSON.stringify({ error: "fileUrl obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Download the file stream from Supabase Storage or external URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Falha ao baixar áudio da URL: " + response.statusText }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mime = response.headers.get("content-type") || "audio/mp3";
    const blob = await response.blob();
    const size = blob.size;

    // 2. Upload to Gemini File API
    const uploadUrl = "https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=" + API_KEY;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Command": "upload, finalize",
        "X-Goog-Upload-Header-Content-Length": String(size),
        "X-Goog-Upload-Header-Content-Type": mime,
        "Content-Type": mime
      },
      body: blob
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return new Response(JSON.stringify({ error: "Falha ao fazer upload para Gemini: " + errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileInfo = await uploadRes.json();
    const fileUri = fileInfo.file.uri;

    // 3. Request Transcription
    const body = {
      contents: [
        {
          parts: [
            { fileData: { fileUri: fileUri, mimeType: mime } },
            { text: "Transcreva este áudio com precisão, preservando jargões jurídicos. Não invente palavras. Retorne apenas a transcrição." }
          ]
        }
      ]
    };

    const genUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + API_KEY;
    const genRes = await fetch(genUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!genRes.ok) {
      const errText = await genRes.text();
      errMsg = "Gemini Error: " + errText;
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const genData = await genRes.json();
    inputUnits = Number(genData?.usageMetadata?.promptTokenCount ?? 0);
    outputUnits = Number(genData?.usageMetadata?.candidatesTokenCount ?? 0);
    const text = genData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    success = true;

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    errMsg = String(e?.message ?? e);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    // try {
    //   await logAiCall({
    //     functionName: "transcrever-audio",
    //     kind: "transcription",
    //     model: MODEL,
    //     triggerType: "manual",
    //     inputUnits, outputUnits,
    //     durationMs: Date.now() - startedAt,
    //     success, error: errMsg,
    //   });
    // } catch (e) {}
  }
});
