import { transcribeAudio } from "../_shared/horusMedia.ts";
import { MODELS } from "../_shared/ai-models.ts";

export const handler = async (req: Request) => {
  try {
    const body = await req.json();
    const base64 = body.base64;
    const mimetype = body.mimetype || "audio/ogg";
    
    if (!base64) {
      return new Response(JSON.stringify({ error: "Missing base64" }), { status: 400 });
    }

    const t = await transcribeAudio(base64, mimetype);
    
    return new Response(JSON.stringify({ 
      success: true, 
      text: t,
      model: MODELS.text
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), { status: 500 });
  }
};

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
serve(handler);
