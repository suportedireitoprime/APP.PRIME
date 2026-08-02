// Analisa o sumário/estrutura de um livro (biblioteca_leitura_nativa) e
// devolve uma lista de aulas sugeridas (titulo_melhorado, resumo_capitulo,
// capitulo_ref) para o admin aprovar antes de gerar as aulas.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = new Set(["wn7corporation@gmail.com", "suporte.vacatio@gmail.com", "wn7juridico@gmail.com"]);
// v9 — leitura nativa usa SOMENTE a GEMINI_API_KEY direta, via Gemini native API.
const MODEL = "gemini-2.5-flash-lite";
const PROVIDER = "gemini-direto";
const DEPLOY_VERSION = "analisar-sumario-livro-gemini-native-v9";

const SYSTEM_PROMPT = `Você é um professor de Direito planejando um CURSO em vídeo-aula a partir de um LIVRO jurídico.
Recebe o SUMÁRIO (índice) e um trecho do conteúdo do livro. Sua tarefa:

1. Identificar os capítulos/tópicos que farão sentido como AULAS individuais (5 a 20 aulas).
2. Melhorar o título de cada aula para ser CLARO, DIDÁTICO e ATRAENTE em PT-BR (máx 80 chars).
3. Escrever um resumo de 2-3 frases do que a aula deve cobrir.
4. Ordenar do introdutório ao avançado.

Responda EXATAMENTE com este JSON, sem texto extra:
{
  "aulas": [
    {
      "ordem": 1,
      "titulo_original": "string exato do sumário",
      "titulo_melhorado": "string didática",
      "resumo_capitulo": "2-3 frases",
      "capitulo_ref": { "pagina_inicio": null, "pagina_fim": null, "path": "1.1" }
    }
  ]
}`;

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
    const { data: userRes } = await authClient.auth.getUser();
    const email = userRes?.user?.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.has(email)) return json({ error: "apenas administradores" }, 403);

    const body = await req.json().catch(() => ({}));
    if (body?.__healthcheck === true) {
      return json({ ok: true, provider: PROVIDER, model: MODEL, version: DEPLOY_VERSION, geminiConfigured: Boolean(GEMINI_API_KEY) });
    }
    const { livro_nativa_id, area_id } = body;
    if (!livro_nativa_id) return json({ error: "livro_nativa_id obrigatório" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: livro, error: lErr } = await admin
      .from("biblioteca_leitura_nativa")
      .select("id, livro_id, livro_tabela, sumario_json, capitulos_json, conteudo_md, conteudo_md_refinado, status, refino_status")
      .eq("id", livro_nativa_id)
      .maybeSingle();
    if (lErr || !livro) return json({ error: "livro OCR não encontrado" }, 404);
    const conteudoBase = String(livro.conteudo_md_refinado || livro.conteudo_md || "");
    const temConteudoExtraido = conteudoBase.trim().length > 300;
    if (livro.status !== "pronto" && livro.refino_status !== "pronto" && !temConteudoExtraido) {
      return json({ error: "OCR do livro ainda não está pronto" }, 400);
    }

    const sumario = livro.capitulos_json || livro.sumario_json || null;
    const conteudo = conteudoBase.slice(0, 45000);
    const resolvedAreaId = await resolveAreaId(admin, area_id, livro);

    const userContent = [
      sumario ? `SUMÁRIO EXTRAÍDO (JSON):\n${JSON.stringify(sumario).slice(0, 8000)}` : "SUMÁRIO EXTRAÍDO: (não estruturado)",
      "",
      "CONTEÚDO DO LIVRO (trecho):",
      conteudo,
    ].join("\n");

    let aulas: any[] = [];
    let lastRaw: any = null;
    let lastStatus = 0;
    console.log(`[analisar-sumario-livro] provedor=${PROVIDER} modelo=${MODEL}`);
    for (let attempt = 0; attempt < 3; attempt++) {
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
      lastStatus = aiRes.status;
      if (aiRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!aiRes.ok) {
        const detail = await aiRes.text().catch(() => "");
        lastRaw = { status: aiRes.status, detail };
        const msg = aiRes.status === 402
          ? `Sua conta/projeto Google Gemini recusou por cobrança/crédito (HTTP 402). Não foi usado Lovable AI. ${detail.slice(0, 300)}`
          : `Sua chave do Gemini falhou (HTTP ${aiRes.status}). Não foi usado Lovable AI. ${detail.slice(0, 300)}`;
        return json({ error: msg, status: aiRes.status, detail, provider: PROVIDER, model: MODEL, version: DEPLOY_VERSION }, aiRes.status === 401 || aiRes.status === 403 ? aiRes.status : 502);
      }
      const aiJson = await aiRes.json();
      lastRaw = aiJson;
      const candidate = aiJson?.candidates?.[0];
      const finish = candidate?.finishReason;
      if (finish === "RECITATION" || finish === "SAFETY") {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      let parsed: any = {};
      const content = candidate?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";
      try { parsed = JSON.parse(content || "{}"); } catch { parsed = {}; }
      const arr: any[] = Array.isArray(parsed.aulas) ? parsed.aulas : [];
      if (arr.length > 0) { aulas = arr; break; }
      break;
    }
    if (aulas.length === 0) {
      return json({ error: "IA não retornou aulas (rate limit ou resposta vazia após retries)", status: lastStatus, raw: lastRaw, provider: PROVIDER, model: MODEL, version: DEPLOY_VERSION }, 502);
    }

    // limpa sugestões antigas não aprovadas do mesmo livro
    await admin.from("aprender_sumario_sugerido")
      .delete()
      .eq("livro_id", livro_nativa_id)
      .eq("aprovado", false);

    const rows = aulas.map((a, i) => ({
      livro_id: livro_nativa_id,
      area_id: resolvedAreaId,
      ordem: Number(a.ordem ?? i + 1),
      titulo_original: a.titulo_original ? String(a.titulo_original).slice(0, 300) : null,
      titulo_melhorado: String(a.titulo_melhorado || a.titulo_original || `Aula ${i + 1}`).slice(0, 300),
      resumo_capitulo: a.resumo_capitulo ? String(a.resumo_capitulo).slice(0, 2000) : null,
      capitulo_ref: a.capitulo_ref ?? null,
      aprovado: false,
    }));

    const { data: inseridas, error: insErr } = await admin
      .from("aprender_sumario_sugerido")
      .insert(rows)
      .select("id, ordem, titulo_melhorado");
    if (insErr) throw insErr;

    return json({ ok: true, total: inseridas?.length ?? 0, aulas: inseridas, provider: PROVIDER, model: MODEL, version: DEPLOY_VERSION });
  } catch (e: any) {
    console.error("[analisar-sumario-livro]", e);
    return json({ error: String(e?.message ?? e), provider: PROVIDER, model: MODEL, version: DEPLOY_VERSION }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-App-AI-Provider": PROVIDER,
      "X-App-AI-Model": MODEL,
      "X-App-Function-Version": DEPLOY_VERSION,
    },
  });
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} ausente`);
  return value;
}

async function resolveAreaId(admin: any, bodyAreaId: unknown, livro: any): Promise<string | null> {
  if (typeof bodyAreaId === "string" && bodyAreaId.trim()) return bodyAreaId;
  if (!["biblioteca_estudos", "areas"].includes(livro?.livro_tabela) || !livro?.livro_id) return null;
  const bibliotecaId = Number(livro.livro_id);
  if (!Number.isFinite(bibliotecaId)) return null;

  const { data: biblioteca } = await admin
    .from("biblioteca_estudos")
    .select("area")
    .eq("id", bibliotecaId)
    .maybeSingle();
  const areaNome = typeof biblioteca?.area === "string" ? biblioteca.area : "";
  if (!areaNome) return null;

  const { data: area } = await admin
    .from("aprender_areas")
    .select("id")
    .ilike("nome", areaNome)
    .maybeSingle();
  return area?.id ?? null;
}
