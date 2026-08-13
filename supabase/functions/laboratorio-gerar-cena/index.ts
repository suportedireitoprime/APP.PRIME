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
    const { codigo_nome, artigo_numero, artigo_texto, force_regenerate } = await req.json();
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
    if (!force_regenerate) {
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
    }

    // Se nao tem cache, pede para o Gemini gerar
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY nao configurada");
    }

    if (force_regenerate === "SHOW_MODELS") {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
      const j = await resp.json();
      return new Response(JSON.stringify(j), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const prompt = `Você é um diretor de cinema de animações 3D educacionais para o app Direito Prime.
Seu trabalho é criar um EXEMPLO PRÁTICO (caso concreto fictício) que ilustre o crime descrito no artigo penal seguindo a DIRETIVA SUPREMA DE CENAS 3D (skill-cena-artigo).

REGRAS ABSOLUTAS DE DIREÇÃO DE ARTE E CONTEÚDO:
- NÃO use linguagem jurídica abstrata. NÃO cite "princípios" ou "regras de ouro".
- CRIE UMA HISTÓRIA CONCRETA com personagens fictícios (ex: "Carlos", "Maria").
- Descreva AÇÕES VISÍVEIS que acontecem na cena: quem faz o quê, onde, como.
- Exemplo BOM: "Carlos se aproxima de Maria por trás no beco escuro e arranca sua bolsa à força."
- O texto de cada step deve narrar a cena como se fosse um documentário policial.

DIRETIVAS NATIVAS DE CENA 3D (skill-cena-artigo):
1. **Cenários Fechados & Atmosfera:** Escolha um ambiente rico: "alley" (beco), "park" (praça com chuva), "office" (repartição), "hospital" (com monitor EKG/leito) ou "prison" (cela/ala feminina). Evite vazios.
2. **Adereços e Props:** Indique adereços específicos para os personagens e para a cena: "gun" (arma com muzzle flash), "crib" (berço), "iv_pole" (soro), "rain" (chuva), "car", "knife".
3. **Emoções Faciais:** Especifique o estado emocional dos personagens em cada passo: "sad" (triste/olhos caídos), "angry" (bravo/olhos inclinados), "fearful" (assustado), "relieved" (aliviado), "neutral".
4. **Caracterização Feminina:** Se houver personagem feminina (ex: Maria), defina "has_female_character": true para usar vestimenta rosa (0xec4899), traços acinturados e cabelo longo.

CONTEXTO:
Código: ${codigo_nome}
Artigo: ${artigo_numero}
Texto Legal (se disponível): ${artigo_texto || "Gere baseado no que você sabe do artigo " + artigo_numero + " do " + codigo_nome}

INSTRUÇÕES DO ROTEIRO:
1. Crie uma timeline com 3 a 5 passos (steps 0 a 4).
2. Cada step deve conter:
   - "step": número sequencial começando em 0.
   - "duration": duração em ms (5000 a 8000).
   - "text": A narração do que está acontecendo NA CENA (exemplo prático).
   - "cam": { "x": number, "y": number, "z": number, "lookX": number, "lookY": number, "fov": number }
   - "agent_pos": { "x": number, "z": number, "rotY": number } (posição do infrator/agente)
   - "victim_pos": { "x": number, "z": number, "rotY": number } ou null
   - "agent_emotion": "angry" | "fearful" | "sad" | "neutral"
   - "victim_emotion": "sad" | "relieved" | "fearful" | "neutral"

MOVIMENTAÇÃO: Faça os personagens se moverem entre steps! O infrator deve se aproximar da vítima. Use coordenadas diferentes em cada step.

RETORNO: JSON puro, sem markdown, seguindo esta interface:
{
  "environment": "alley",
  "has_female_character": false,
  "props": [],
  "timeline": [
    {
      "step": 0,
      "duration": 6000,
      "text": "Descreva a cena concreta, como: Carlos anda pela rua à noite...",
      "cam": { "x": 0, "y": 3, "z": 8, "lookX": 0, "lookY": 1, "fov": 50 },
      "agent_pos": { "x": 0, "z": 0, "rotY": 0 },
      "victim_pos": null,
      "agent_emotion": "neutral",
      "victim_emotion": "neutral"
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
      throw new Error(`Erro na API do Gemini: ${err}`);
    }

    const geminiData = await geminiRes.json();
    let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean potential markdown blocks
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let cena_json;
    try {
      cena_json = JSON.parse(textResponse);
    } catch (parseError) {
      throw new Error(`Erro ao fazer parse do JSON do Gemini. Texto recebido: ${textResponse}`);
    }

    // Save or update to cache
    const { error: upsertError } = await supabase.from("laboratorio_cenas").upsert({
      codigo_nome,
      artigo_numero,
      cena_json,
    }, { onConflict: 'codigo_nome,artigo_numero' });
    
    if (upsertError) console.error("Erro ao salvar no cache:", upsertError);

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
