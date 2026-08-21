// Gera visuais jurídicos (mapa mental, infográfico, fluxograma, diagrama) com a
// MESMA chave Gemini do chat da professora (GEMINI_API_KEY + reserva).
//
// A IA nunca desenha: devolve apenas conteúdo estruturado em JSON, dentro de
// limites rígidos de tamanho. O desenho é feito no app por um motor de layout.
// Cada (tipo, categoria, item) é gerado UMA única vez e fica em cache global.

import { createClient } from "npm:@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/geminiFetch.ts";
import { MODELS } from "../_shared/ai-models.ts";
import { normalizeContent, promptFor, type VisualTipo } from "./prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = MODELS.text; // "gemini-2.5-flash-lite"

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TIPOS: VisualTipo[] = ["mapa_mental", "infografico", "fluxograma", "diagrama"];
const CATEGORIAS = ["materias", "leis", "jurisprudencia"];

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

async function callGemini(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
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
    console.error("[visual-juridico-gerar] Gemini API erro:", res.status, body.slice(0, 400));
    throw new Error(`Gemini API (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = JSON.parse(body);
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const texto = parts.map((p: Record<string, unknown>) => String(p?.text ?? "")).join("").trim();
  if (!texto) throw new Error("Gemini retornou resposta vazia");
  return texto;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GEMINI_API_KEY && !Deno.env.get("GEMINI_API_KEY_RESERVA")) {
      return json({ error: "Nenhuma chave Gemini configurada no Supabase" }, 500);
    }

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
    let ultimoErro = "";
    for (let tentativa = 0; tentativa < 2 && !conteudo; tentativa++) {
      const prompt = promptFor(tipo, itemLabel, contexto, tentativa === 1);
      const raw = await callGemini(prompt);
      const parsed = parseJsonLoose(raw);
      conteudo = normalizeContent(tipo, parsed);
      if (!conteudo) {
        ultimoErro = `formato inválido (tentativa ${tentativa + 1}): ${raw.slice(0, 400)}`;
        console.error("visual-juridico-gerar formato inválido:", raw.slice(0, 800));
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
          modelo: MODEL,
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
        model: MODEL,
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
