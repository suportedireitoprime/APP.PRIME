import { createClient } from "npm:@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/geminiFetch.ts";
import { MODELS } from "../_shared/ai-models.ts";
import { normalizeContent, promptFor, type VisualTipo } from "./prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY") ?? "";
const OMNIROUTE_URL = (Deno.env.get("OMNIROUTE_URL") || "http://147.224.236.150:20128").trim().replace(/\/+$/, "");
const OMNIROUTE_API_KEY = (Deno.env.get("OMNIROUTE_API_KEY") || "sk-9d114c31bbf54179-6947cb-36742343").trim();

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const OMNI_MODEL = "antigravity/gemini-3.8-flash-low";
const MISTRAL_MODEL = "mistral-small-latest";
const GEMINI_MODEL = MODELS.text;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TIPOS: VisualTipo[] = ["mapa_mental", "infografico", "fluxograma", "diagrama"];
const CATEGORIAS = ["materias", "codigos", "estatutos", "leis_especiais", "previdenciario", "leis", "jurisprudencia"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function parseJsonLoose(text: string): any {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch { /* ignora */ }
    }
    return null;
  }
}

async function callOmniRoute(prompt: string): Promise<string> {
  if (!OMNIROUTE_API_KEY) throw new Error("OMNIROUTE_API_KEY não configurada");
  const endpoint = OMNIROUTE_URL.endsWith("/v1")
    ? `${OMNIROUTE_URL}/chat/completions`
    : `${OMNIROUTE_URL}/v1/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OMNIROUTE_API_KEY}`,
      },
      body: JSON.stringify({
        model: OMNI_MODEL,
        messages: [
          {
            role: "system",
            content: "Você é um gerador estruturado de esquemas jurídicos. Responda EXCLUSIVAMENTE com JSON válido, sem markdown e sem texto fora do JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 2400,
      }),
      signal: controller.signal,
    });
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`OmniRoute (${res.status}): ${body.slice(0, 200)}`);
    }
    const data = JSON.parse(body);
    const texto = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!texto) throw new Error("OmniRoute retornou resposta vazia");
    return texto;
  } finally {
    clearTimeout(timer);
  }
}

async function callMistral(prompt: string): Promise<string> {
  if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY não configurada");
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [
        {
          role: "system",
          content: "Responda EXCLUSIVAMENTE com JSON válido.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2400,
      response_format: { type: "json_object" },
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Mistral (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = JSON.parse(body);
  const texto = String(data?.choices?.[0]?.message?.content ?? "").trim();
  if (!texto) throw new Error("Mistral retornou resposta vazia");
  return texto;
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY && !Deno.env.get("GEMINI_API_KEY_RESERVA")) {
    throw new Error("GEMINI_API_KEY não configurada");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await geminiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.55,
        topP: 0.9,
        maxOutputTokens: 2400,
        responseMimeType: "application/json",
      },
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = JSON.parse(body);
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const texto = parts.map((p: Record<string, unknown>) => String(p?.text ?? "")).join("").trim();
  if (!texto) throw new Error("Gemini retornou resposta vazia");
  return texto;
}

async function generateWithProviders(prompt: string): Promise<{ raw: string; modelUsed: string }> {
  const providers: Array<{ name: string; model: string; fn: (p: string) => Promise<string> }> = [
    { name: "OmniRoute", model: OMNI_MODEL, fn: callOmniRoute },
    { name: "Mistral", model: MISTRAL_MODEL, fn: callMistral },
    { name: "Gemini", model: GEMINI_MODEL, fn: callGemini },
  ];

  const erros: string[] = [];
  for (const prov of providers) {
    try {
      const raw = await prov.fn(prompt);
      return { raw, modelUsed: prov.model };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[visual-juridico-gerar] ${prov.name} falhou:`, msg);
      erros.push(`${prov.name}: ${msg}`);
    }
  }
  throw new Error(erros[0] || "Todos os provedores de IA falharam");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const tipo = String(body?.tipo ?? "") as VisualTipo;
    const categoria = String(body?.categoria ?? "");
    const itemKey = String(body?.item_key ?? "").trim();
    const itemLabel = String(body?.item_label ?? "").trim();
    const contexto = String(body?.contexto ?? "").trim();

    if (!TIPOS.includes(tipo)) return json({ error: "tipo inválido" }, 400);
    if (!CATEGORIAS.includes(categoria)) return json({ error: "categoria inválida" }, 400);
    if (!itemKey || itemKey.length > 160) return json({ error: "item_key inválido" }, 400);
    if (!itemLabel || itemLabel.length > 200) return json({ error: "item_label inválido" }, 400);
    if (!contexto || contexto.length > 600) return json({ error: "contexto inválido" }, 400);

    // Cache global: se já existe, devolve sem chamar IA.
    const { data: existente } = await admin
      .from("visuais_juridicos")
      .select("id, tipo, categoria, item_key, item_label, titulo, conteudo, fonte, views, created_at")
      .eq("tipo", tipo)
      .eq("categoria", categoria)
      .eq("item_key", itemKey)
      .maybeSingle();
    if (existente) return json({ visual: existente, cached: true });

    // Quem gerou (opcional — a função também roda sem sessão).
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data?.user?.id ?? null;
    }

    let conteudo = null;
    let modelUsed = OMNI_MODEL;
    let ultimoErro = "";
    for (let tentativa = 0; tentativa < 2 && !conteudo; tentativa++) {
      const prompt = promptFor(tipo, itemLabel, contexto, tentativa === 1);
      const gen = await generateWithProviders(prompt);
      modelUsed = gen.modelUsed;
      const parsed = parseJsonLoose(gen.raw);
      conteudo = normalizeContent(tipo, parsed);
      if (!conteudo) {
        ultimoErro = `formato inválido (tentativa ${tentativa + 1}): ${gen.raw.slice(0, 200)}`;
        console.error("visual-juridico-gerar formato inválido:", gen.raw.slice(0, 600));
      }
    }
    if (!conteudo) return json({ error: `IA não devolveu conteúdo válido: ${ultimoErro}` }, 502);

    const { data: inserido, error: insertError } = await admin
      .from("visuais_juridicos")
      .upsert(
        {
          tipo,
          categoria,
          item_key: itemKey,
          item_label: itemLabel,
          titulo: conteudo.titulo,
          fonte: conteudo.fonte || null,
          conteudo,
          modelo: modelUsed,
          gerado_por: userId,
        },
        { onConflict: "tipo,categoria,item_key" },
      )
      .select("id, tipo, categoria, item_key, item_label, titulo, conteudo, fonte, views, created_at")
      .single();
    if (insertError) throw insertError;

    try {
      const { logAiCall } = await import("../_shared/ai-log.ts");
      await logAiCall({
        functionName: "visual-juridico-gerar",
        kind: "text",
        model: modelUsed,
        triggerType: "manual",
        success: true,
      } as any);
    } catch { /* log nunca quebra a resposta */ }

    return json({ visual: inserido, cached: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("visual-juridico-gerar:", msg);
    const status = msg.includes("429") ? 429 : 500;
    return json({ error: msg }, status);
  }
});
