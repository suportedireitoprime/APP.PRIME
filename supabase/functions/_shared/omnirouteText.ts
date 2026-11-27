import { MODELS } from "./ai-models.ts";
import { geminiFetch } from "./geminiFetch.ts";

const OMNIROUTE_URL = (Deno.env.get("OMNIROUTE_URL") || "http://147.224.236.150:20128")
  .trim()
  .replace(/\/+$/, "");
const RAW_OMNI_KEY = (Deno.env.get("OMNIROUTE_API_KEY") || "").trim();
const OMNIROUTE_API_KEY =
  RAW_OMNI_KEY && !RAW_OMNI_KEY.includes("sk-03fcfd71") && !RAW_OMNI_KEY.includes("sk-38e56915")
    ? RAW_OMNI_KEY
    : "sk-9d114c31bbf54179-6947cb-36742343";

const MISTRAL_API_KEY = (Deno.env.get("MISTRAL_API_KEY") || "").trim();
const GEMINI_API_KEY = (Deno.env.get("GEMINI_API_KEY") || "").trim();

const OMNI_MODEL = "antigravity/gemini-3.8-flash-low";
const MISTRAL_MODEL = "mistral-small-latest";

export interface GenerateTextOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

async function callOmniRoute(opts: GenerateTextOptions): Promise<string> {
  const endpoint = OMNIROUTE_URL.endsWith("/v1")
    ? `${OMNIROUTE_URL}/chat/completions`
    : `${OMNIROUTE_URL}/v1/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
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
          { role: "system", content: opts.systemPrompt },
          { role: "user", content: opts.userPrompt },
        ],
        temperature: opts.temperature ?? 0.55,
        max_tokens: opts.maxTokens ?? 4096,
      }),
      signal: controller.signal,
    });
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`OmniRoute (${res.status}): ${body.slice(0, 200)}`);
    }
    const data = JSON.parse(body);
    const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error("OmniRoute retornou resposta vazia");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function callMistral(opts: GenerateTextOptions): Promise<string> {
  if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY ausente");
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: [
        { role: "system", content: opts.systemPrompt },
        { role: "user", content: opts.userPrompt },
      ],
      temperature: opts.temperature ?? 0.55,
      max_tokens: opts.maxTokens ?? 4096,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Mistral (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = JSON.parse(body);
  const text = String(data?.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error("Mistral retornou resposta vazia");
  return text;
}

async function callGemini(opts: GenerateTextOptions): Promise<string> {
  if (!GEMINI_API_KEY && !Deno.env.get("GEMINI_API_KEY_RESERVA")) {
    throw new Error("GEMINI_API_KEY ausente");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.text}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await geminiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: opts.userPrompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.55,
        maxOutputTokens: opts.maxTokens ?? 4096,
        ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = JSON.parse(body);
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p: Record<string, unknown>) => String(p?.text ?? "")).join("").trim();
  if (!text) throw new Error("Gemini retornou resposta vazia");
  return text;
}

/**
 * Gera texto/JSON usando OmniRoute como provedor principal e
 * Mistral/Gemini como fallback automático.
 */
export async function generateTextWithOmniRoute(opts: GenerateTextOptions): Promise<string> {
  const providers = [
    { name: "OmniRoute", fn: callOmniRoute },
    { name: "Mistral", fn: callMistral },
    { name: "Gemini", fn: callGemini },
  ];

  const erros: string[] = [];
  for (const prov of providers) {
    try {
      return await prov.fn(opts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[omnirouteText] ${prov.name} falhou:`, msg);
      erros.push(`${prov.name}: ${msg}`);
    }
  }
  throw new Error(erros[0] || "Todos os provedores de IA falharam");
}
