// Edge Function: recebe uma transcrição e devolve resumo estruturado (JSON).
// Modelo obrigatório: gemini-2.5-flash-lite direto na chave Gemini do projeto.

import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Você é um assistente que resume aulas jurídicas em português.
Recebe a transcrição de uma aula e devolve um JSON com:
- titulo: título curto (max 60 chars) que descreva a aula
- resumo: parágrafo de 2-4 frases
- topicos: array de tópicos principais (bullets curtos, max 8)
- conceitos: array {termo, definicao} com termos-chave (max 8)
- duvidas: array de perguntas de revisão sugeridas (max 5)
Seja fiel à transcrição, não invente conteúdo.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { transcript, title } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const GEMINI_API_KEY = (Deno.env.get("GEMINI_API_KEY") ?? "").trim();
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY ausente. Salve sua chave do Gemini nos secrets do projeto." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trunca transcrições muito longas para caber em uma chamada (aproximação por chars).
    const MAX = 60000;
    const text = transcript.length > MAX ? transcript.slice(0, MAX) + "\n[...truncado]" : transcript;

    console.log("[gerar-resumo-aula] provedor=gemini-proprio modelo=gemini-2.5-flash-lite");
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Título sugerido pelo usuário: ${title || "(sem título)"}\n\nTranscrição:\n${text}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[gerar-resumo-aula] gemini ${res.status}: ${detail}`);
      const msg = res.status === 402
        ? `Sua conta/projeto Google Gemini recusou por cobrança/crédito (HTTP 402). Não foi usado Lovable AI. ${detail.slice(0, 300)}`
        : res.status === 401 || res.status === 403
          ? `Sua chave do Gemini foi recusada (HTTP ${res.status}). Verifique a GEMINI_API_KEY e se a API Generative Language está habilitada.`
          : res.status === 429
            ? "Limite de requisições do Gemini atingido. Tente novamente em instantes."
            : `Gemini indisponível (HTTP ${res.status}). ${detail.slice(0, 300)}`;
      return new Response(JSON.stringify({ error: msg, status: res.status, detail }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const j = await res.json();
    const raw = j?.choices?.[0]?.message?.content ?? "{}";
    let summary: any;
    try { summary = JSON.parse(raw); } catch { summary = { resumo: raw }; }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
