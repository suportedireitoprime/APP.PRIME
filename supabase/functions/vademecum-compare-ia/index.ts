import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildGeminiTextUrl } from "../_shared/ai-models.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { textoBanco, textoPlanaltoNovo, textoPlanaltoAntigo } = await req.json();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY não configurada no Supabase.");
    }

    const prompt = `
Você é um assistente jurídico revisor de Códigos de Lei (Vade Mecum).
Sua tarefa é comparar o texto atual do nosso Banco de Dados com o texto recentemente raspado do Diário Oficial / Planalto.

Texto no nosso Banco de Dados:
"${textoBanco || 'N/A'}"

Texto Antigo Revogado pelo Planalto:
"${textoPlanaltoAntigo || 'N/A'}"

Texto Novo Inserido/Atualizado no Planalto:
"${textoPlanaltoNovo || 'N/A'}"

Responda ESTRITAMENTE em formato JSON, seguindo esta estrutura, analisando se nosso Banco de Dados precisa ser atualizado:
{
  "status": "match" | "diff",
  "reason": "Explicação curta do motivo."
}
"match" significa que o banco de dados JÁ possui a mesma redação do Texto Novo (está atualizado).
"diff" significa que o banco de dados está desatualizado (possui a redação antiga ou algo totalmente diferente).
`;

    const url = buildGeminiTextUrl(apiKey);
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });

    const aiData = await res.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const textResponse = aiData.candidates[0].content.parts[0].text;
    
    // Limpeza de possíveis blocos de markdown antes do parser
    const cleanText = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanText);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Retorna HTTP 200 para passar pela barreira do supabase.invoke no front, enviando a msg de erro no payload
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
