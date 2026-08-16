// Gera flashcards a partir de um tema e área informados (via Gemini)
// Função administrativa

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "gemini-3.1-flash-lite";
const PROVIDER = "gemini-direto";

const SYSTEM_PROMPT = `Você é um professor e especialista em Direito criando FLASHCARDS ricos e VARIADOS para estudantes e concurseiros.

Recebe:
- Categoria (Ex: Jurisprudência, Leis, Termos Jurídicos, Matérias)
- Área do Direito (Ex: Direito Constitucional, Direito Penal)
- Tema Específico (Ex: Súmula Vinculante 14, Princípios Fundamentais, Lei 8.112/90)
- Quantidade Desejada

Missão: PRODUZIR flashcards de altíssima qualidade sobre o tema solicitado.
Cubra o máximo possível: definições, exceções, prazos, competências, requisitos, consequências, exemplos práticos, distinção entre institutos e pegadinhas comuns de concursos.

REGRAS:
- Entregue a quantidade solicitada (ou o mais próximo possível, se o tema for muito curto).
- Cada flashcard deve ser COMPLETO. Nada de resposta rasa.
- Não repita a mesma pergunta com outras palavras.

Devolva UM JSON:
{
  "flashcards": [
    {
      "frente": "Pergunta curta e direta (até 140 chars)",
      "verso": "Resposta direta (1 a 2 frases)",
      "explicacao": "2-4 frases explicando o porquê, o fundamento jurídico ou a regra principal",
      "exemplo": "Breve caso concreto ou aplicação prática (opcional, pode ser null)",
      "dica": "Opcional: macete ou pegadinha (pode ser null)",
      "artigo_numero": "Opcional: artigo da lei aplicável (ex: Art. 5º, XLV da CF) (pode ser null)"
    }
  ]
}

PT-BR jurídico, elegante e didático. Responda APENAS com o JSON.`;

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} ausente`);
  return v;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  try {
    const SUPABASE_URL = requireEnv("SUPABASE_URL");
    const SERVICE_ROLE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
    const GEMINI_API_KEY = requireEnv("GEMINI_API_KEY").trim();

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "não autenticado" }, 401);

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    
    const { data: userRes, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userRes?.user) return json({ error: "token inválido" }, 401);
    
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => null);
    const categoria = typeof body?.categoria === "string" ? body.categoria.trim() : "";
    const area = typeof body?.area === "string" ? body.area.trim() : "";
    const tema = typeof body?.tema === "string" ? body.tema.trim() : "";
    const quantidade = typeof body?.quantidade === "number" ? body.quantidade : 20;

    if (!area || !tema) return json({ error: "area e tema são obrigatórios" }, 400);

    const userContent = `CATEGORIA: ${categoria}\nÁREA: ${area}\nTEMA: ${tema}\nQUANTIDADE DESEJADA: ${quantidade} flashcards\n\nGere flashcards sobre este tema com foco no formato da categoria (${categoria}).`;

    console.log(`[admin-flashcards-gerar] area=${area} tema=${tema} qtd=${quantidade} provedor=${PROVIDER} modelo=${MODEL}`);
    
    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => "");
      console.error(`[admin-flashcards-gerar] gemini falhou: ${aiRes.status}: ${detail}`);
      return json({ error: `Gemini API falhou (HTTP ${aiRes.status})`, detail }, 502);
    }

    const aiJson = await aiRes.json();
    let parsed: any = {};
    try {
      const content = aiJson?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "";
      parsed = JSON.parse(content || "{}");
    } catch {
      parsed = {};
    }

    const flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
    if (flashcards.length === 0) return json({ error: "IA retornou 0 flashcards", parsed }, 502);

    const clean: any[] = [];
    for (const f of flashcards) {
      const pergunta = String(f?.frente || "").trim();
      const resposta = String(f?.verso || "").trim();
      if (!pergunta || !resposta) continue;
      
      clean.push({
        area,
        tema,
        pergunta,
        resposta,
        exemplo: f?.exemplo ? String(f.exemplo).trim() : null,
        reforco_conteudo: f?.explicacao ? String(f.explicacao).trim() : null,
        dica: f?.dica ? String(f.dica).trim() : null,
        artigo_numero: f?.artigo_numero ? String(f.artigo_numero).trim() : null,
        status: 'published'
      });
    }

    if (clean.length > 0) {
      const { error: iErr } = await adminClient.from("flashcards_cards").insert(clean);
      if (iErr) throw iErr;
      
      // Disparar push notification
      try {
        const msgBody = `Foram criados ${clean.length} novos flashcards de ${tema} na área de ${area}.`;
        await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: `🦉 Hórus informa: Flashcards Adicionados!`,
            body: msgBody,
            url: `/flashcards`,
            audience: { all: true }
          })
        });
      } catch (err) {
        console.error("Erro ao enviar push:", err);
      }
    }

    return json({ ok: true, total: clean.length });
  } catch (e: any) {
    console.error("[admin-flashcards-gerar]", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
