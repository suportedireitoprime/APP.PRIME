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

    const prompt = `Você é um diretor de cinema de animações 3D educacionais para o app Direito Prime.
Seu trabalho é criar um EXEMPLO PRÁTICO (caso concreto fictício) que ilustre o crime descrito no artigo penal.

REGRAS ABSOLUTAS PARA O TEXTO:
- NÃO use linguagem jurídica abstrata. NÃO cite "princípios" ou "regras de ouro".
- CRIE UMA HISTÓRIA CONCRETA com personagens fictícios (ex: "Carlos", "Maria").
- Descreva AÇÕES VISÍVEIS que acontecem na cena: quem faz o quê, onde, como.
- Exemplo BOM: "Carlos se aproxima de Maria por trás no beco escuro e arranca sua bolsa à força."
- Exemplo RUIM: "O princípio da especialidade prevalece sobre a norma geral."
- O texto de cada step deve narrar a cena como se fosse um documentário policial.

CONTEXTO:
Código: ${codigo_nome}
Artigo: ${artigo_numero}
Texto Legal (se disponível): ${artigo_texto || "Gere baseado no que você sabe do artigo " + artigo_numero + " do " + codigo_nome}

INSTRUÇÕES DO ROTEIRO:
1. Crie uma timeline com 3 a 5 passos (steps 0 a 4).
2. O "ambiente" deve ser: "alley" (beco), "park" (praça), "office" (repartição) ou "generic".
3. Cada step deve conter:
   - "step": número sequencial começando em 0.
   - "duration": duração em ms (4000 a 6000).
   - "text": A narração do que está acontecendo NA CENA (exemplo prático, NÃO teoria).
   - "cam": { "x": number, "y": number, "z": number, "lookX": number, "lookY": number, "fov": number }
   - "agent_pos": { "x": number, "z": number, "rotY": number } (posição do infrator)
   - "victim_pos": { "x": number, "z": number, "rotY": number } ou null

MOVIMENTAÇÃO: Faça os personagens se moverem entre steps! O infrator deve se aproximar da vítima. Use coordenadas diferentes em cada step para criar movimento.

RETORNO: JSON puro, sem markdown, seguindo esta interface:
{
  "environment": "alley",
  "timeline": [
    {
      "step": 0,
      "duration": 5000,
      "text": "Carlos observa Maria saindo do banco, sozinha, carregando uma bolsa...",
      "cam": { "x": 6, "y": 5, "z": 12, "lookX": 0, "lookY": 1.5, "fov": 50 },
      "agent_pos": { "x": 5, "z": 4, "rotY": -1.57 },
      "victim_pos": { "x": -3, "z": 2, "rotY": 0 }
    }
  ]
}`;


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
