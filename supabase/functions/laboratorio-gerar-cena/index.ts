import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/geminiFetch.ts";
import { buildGeminiTextUrl } from "../_shared/ai-models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigo_nome, artigo_numero, artigo_texto } = await req.json();
    if (!codigo_nome || artigo_numero === undefined) {
      return new Response(JSON.stringify({ error: "codigo_nome e artigo_numero sao obrigatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verifica no cache (banco de dados)
    const { data: cached } = await supabase
      .from("laboratorio_cenas")
      .select("cena_json")
      .eq("codigo_nome", codigo_nome)
      .eq("artigo_numero", artigo_numero)
      .maybeSingle();

    if (cached?.cena_json) {
      return new Response(JSON.stringify({
        cena_json: cached.cena_json,
        from_cache: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se nao tem cache, pede para o Gemini gerar
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY nao configurada");
    }

    const prompt = `Você é um diretor de animação 3D de cenas criminais educacionais para o app Direito Prime.
Seu objetivo é transformar o texto de um artigo penal em um roteiro JSON estruturado para ser renderizado pelo motor Voxel 3D.

CONTEXTO:
Código: ${codigo_nome}
Artigo: ${artigo_numero}
Texto Legal (se disponível, senao use seu conhecimento): ${artigo_texto || "Gere baseado no que voce sabe do artigo " + artigo_numero + " do " + codigo_nome}

INSTRUÇÕES DO ROTEIRO:
1. Crie uma linha do tempo (timeline) com no máximo 5 passos (steps 0 a 4).
2. O "ambiente" deve ser uma das opções: "alley" (beco escuro), "park" (praça à noite), "office" (repartição pública) ou "generic" (sala limpa).
3. Cada step da timeline deve conter:
   - "step": numero sequencial começando em 0.
   - "duration": duracao em milisegundos (ex: 4000 a 6000), dependendo do tamanho do texto.
   - "text": A fala de narração ou descrição que vai aparecer no balão.
   - "cam": Posição e alvo da câmera: { "x": number, "y": number, "z": number, "lookX": number, "lookY": number, "fov": number }. Use valores para focar nos personagens (personagens ficam perto de x=0, z=0).
   - "agent_pos": Posição do Agente Infrator (personagem 1): { "x": number, "z": number, "rotY": number (em radianos) }
   - "victim_pos": Posição da Vítima/Objeto (personagem 2): { "x": number, "z": number, "rotY": number } (use null se nao houver vítima visivel)

O RETORNO DEVE SER EXCLUSIVAMENTE UM JSON VÁLIDO (sem markdown envolta), seguindo essa interface:
{
  "environment": "alley",
  "timeline": [
    {
      "step": 0,
      "duration": 5000,
      "text": "Cena 1: Descrição inicial do artigo...",
      "cam": { "x": 4, "y": 5, "z": 10, "lookX": 0, "lookY": 1.5, "fov": 50 },
      "agent_pos": { "x": 2, "z": 2, "rotY": 0 },
      "victim_pos": { "x": -2, "z": 2, "rotY": 3.14 }
    }
  ]
}
Gere a cena focando nos verbos do crime. Formate estritamente em JSON puro.`;

    const geminiRes = await geminiFetch(buildGeminiTextUrl(geminiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini error:", err);
      throw new Error("Erro na API do Gemini");
    }

    const geminiData = await geminiRes.json();
    let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean potential markdown blocks
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const cena_json = JSON.parse(textResponse);

    // Save to cache
    await supabase.from("laboratorio_cenas").insert({
      codigo_nome,
      artigo_numero,
      cena_json,
    });

    return new Response(JSON.stringify({ cena_json, from_cache: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
