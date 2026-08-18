import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to generate embedding via OpenAI
async function generateEmbedding(text: string, openAiKey: string) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, ' '), // Openai recommends replacing newlines for better results
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI error:", errorText);
    throw new Error(`Failed to generate embedding: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseKey || !openAiKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body = {};
    try {
      body = await req.json();
    } catch(e) {}

    // Webhook Mode (Single Record)
    if (body?.record && body.record.id && body.record.texto) {
      const record = body.record;
      console.log(`Processing Webhook for article: ${record.id}`);
      
      const embedding = await generateEmbedding(record.texto, openAiKey);
      
      const { error } = await supabase
        .from("vade_mecum_artigos")
        .update({ embedding })
        .eq("id", record.id);
        
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, processed: 1 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Batch Mode (For backfilling)
    if (body?.type === 'batch' || req.method === 'GET') {
      const limit = body?.limit || 50;
      console.log(`Processing batch mode, limit: ${limit}`);
      
      const { data: artigos, error: fetchError } = await supabase
        .from("vade_mecum_artigos")
        .select("id, texto")
        .is("embedding", null)
        .limit(limit);

      if (fetchError) throw fetchError;
      
      if (!artigos || artigos.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No articles to process", processed: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      let processed = 0;
      for (const artigo of artigos) {
        if (!artigo.texto || artigo.texto.trim() === '') continue;
        
        try {
          const embedding = await generateEmbedding(artigo.texto, openAiKey);
          await supabase
            .from("vade_mecum_artigos")
            .update({ embedding })
            .eq("id", artigo.id);
          processed++;
        } catch (e) {
          console.error(`Error processing article ${artigo.id}:`, e);
        }
      }

      return new Response(JSON.stringify({ success: true, processed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Invalid payload. Send {type: 'batch'} or Webhook payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
