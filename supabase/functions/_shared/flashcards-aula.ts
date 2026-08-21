// Gera MUITOS flashcards a partir de uma aula já criada em `aprender_aulas`.
// Só roda depois que a Teoria (blocos) existir; apaga apenas flashcards antigos
// da aula antes de reinserir.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { sha1 } from "./aprender-blocos.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAILS = new Set([
  "wn7corporation@gmail.com",
  "suporte@direitoprime.com.br",
  "wn7juridico@gmail.com",
]);
// v5 — usa SOMENTE a GEMINI_API_KEY direta, via Gemini native API.
const MODEL = "gemini-2.5-flash-lite";
const PROVIDER = "gemini-direto";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SYSTEM_PROMPT = `Você é um professor de Direito criando FLASHCARDS ricos e VARIADOS para um app de estudo.

Recebe:
- Título e objetivo da aula
- Conteúdo integral da aula (leitura, mapas, fluxogramas, tabelas, citações, destaques)

Missão: PRODUZIR MUITOS flashcards de altíssima qualidade cobrindo o máximo possível do conteúdo — não repita ângulos, varie SEMPRE (definição, exceção, prazo, competência, requisito, consequência, exemplo prático, distinção entre institutos, pegadinha comum de concurso, aplicação em petição/decisão).

REGRAS:
- Meta: 15 a 20 flashcards em aulas normais; 20 a 25 quando a aula for extensa. Nunca menos de 15.
- Cubra TODO o conteúdo da aula: cada seção/tema relevante deve virar pelo menos um flashcard.
- Cada flashcard COMPLETO. Nada de resposta rasa.
- Não repita a mesma pergunta com outras palavras. Se um tema rende só 2 ângulos, vá adiante.

Devolva UM JSON:
{
  "flashcards": [
    {
      "frente": "Pergunta OU conceito curto (até 140 chars)",
      "verso": "Resposta direta, 1 frase",
      "explicacao": "3-5 frases explicando o porquê, fundamento jurídico, alcance e limites",
      "exemplo": "Caso concreto do dia a dia jurídico (situação real, nomes fictícios OK)",
      "aplicando": "Como o operador do direito USA isso na prática (petição, decisão, contrato, prova)",
      "dica": "Opcional: macete ou pegadinha"
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

export async function handleGerarFlashcardsAula(req: Request, raw?: any): Promise<Response> {
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
    if (userErr) return json({ error: "token inválido" }, 401);
    const email = userRes?.user?.email?.toLowerCase();
    // Geração sob demanda: qualquer usuário autenticado pode gerar (admin também).
    if (!email) return json({ error: "não autenticado" }, 401);

    const body = raw ?? (await req.json().catch(() => null));
    const aula_id = typeof body?.aula_id === "string" ? body.aula_id : "";
    if (!UUID_RE.test(aula_id)) return json({ error: "aula_id obrigatório" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: aula } = await admin
      .from("aprender_aulas")
      .select("id, titulo, objetivo")
      .eq("id", aula_id)
      .maybeSingle();
    if (!aula) return json({ error: "aula não encontrada" }, 404);

    const { data: blocos } = await admin
      .from("aprender_blocos")
      .select("ordem, tipo, payload")
      .eq("aula_id", aula_id)
      .order("ordem");

    const contexto = (blocos ?? [])
      .filter((b: any) => b.tipo !== "flashcard" && b.tipo !== "pergunta")
      .map((b: any) => {
        const p = b.payload || {};
        if (b.tipo === "leitura") return `${p.titulo ? `## ${p.titulo}\n` : ""}${p.conteudo || ""}`;
        if (b.tipo === "citacao") return `> ${p.texto || ""} — ${p.autor || ""}`;
        if (b.tipo === "artigo_lei") return `[${p.lei || ""} art. ${p.numero || ""}] ${p.texto || ""}`;
        if (b.tipo === "destaque") return `**${p.titulo || "Destaque"}**: ${p.texto || ""}`;
        if (b.tipo === "mapa_mental") {
          const ramos = (p.ramos || [])
            .map((r: any) =>
              `- ${r.titulo}: ${(r.itens || [])
                .map((it: any) => (typeof it === "string" ? it : `${it.termo} (${it.definicao})`))
                .join("; ")}`,
            )
            .join("\n");
          return `Mapa mental: ${p.raiz}\n${ramos}`;
        }
        if (b.tipo === "fluxograma") {
          return `Fluxograma ${p.titulo || ""}:\n` +
            (p.etapas || []).map((e: any) => `${e.n}. ${e.titulo} — ${e.descricao || ""}`).join("\n");
        }
        if (b.tipo === "linha_tempo") {
          return `Linha do tempo:\n` +
            (p.eventos || []).map((e: any) => `${e.marco}: ${e.titulo} — ${e.descricao || ""}`).join("\n");
        }
        if (b.tipo === "tabela") {
          return `Tabela ${p.titulo || ""}: colunas ${(p.colunas || []).join(" | ")}\n` +
            (p.linhas || []).map((r: any[]) => r.join(" | ")).join("\n");
        }
        return JSON.stringify(p).slice(0, 800);
      })
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 45000);

    const userContent = [
      `AULA: ${aula.titulo}`,
      aula.objetivo ? `OBJETIVO: ${aula.objetivo}` : "",
      "",
      "CONTEÚDO DA AULA:",
      contexto,
    ].filter(Boolean).join("\n");

    console.log(`[gerar-flashcards-aula] provedor=${PROVIDER} modelo=${MODEL}`);
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
      console.error(`[gerar-flashcards-aula] gemini ${aiRes.status}: ${detail}`);
      const msg = aiRes.status === 429
        ? "Limite de requisições do Gemini atingido. Tente novamente em instantes."
        : aiRes.status === 402
          ? `Sua conta/projeto Google Gemini recusou por cobrança/crédito (HTTP 402). Não foi usado Lovable AI. ${detail.slice(0, 300)}`
          : `Sua chave do Gemini falhou (HTTP ${aiRes.status}). Não foi usado Lovable AI. ${detail.slice(0, 300)}`;
      return json(
        { error: msg, status: aiRes.status, detail, provider: PROVIDER, model: MODEL },
        aiRes.status === 429 || aiRes.status === 401 || aiRes.status === 403 ? aiRes.status : 502,
      );
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
    if (flashcards.length < 5) return json({ error: "IA retornou poucos flashcards", parsed, provider: PROVIDER, model: MODEL }, 502);

    // Dedup por hash da frente
    const seen = new Set<string>();
    const clean: any[] = [];
    for (const f of flashcards) {
      const frente = String(f?.frente || "").trim();
      if (!frente) continue;
      const h = await sha1(frente.toLowerCase());
      if (seen.has(h)) continue;
      seen.add(h);
      clean.push({
        frente,
        verso: String(f?.verso || "").trim(),
        explicacao: String(f?.explicacao || "").trim(),
        exemplo: String(f?.exemplo || "").trim(),
        aplicando: String(f?.aplicando || "").trim(),
        dica: String(f?.dica || "").trim(),
      });
    }

    // Descobre próxima ordem e remove antigos flashcards da aula
    await admin.from("aprender_blocos").delete().eq("aula_id", aula_id).eq("tipo", "flashcard");

    const { data: maxRow } = await admin
      .from("aprender_blocos")
      .select("ordem")
      .eq("aula_id", aula_id)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();
    let ordem = (maxRow?.ordem ?? -1) + 1;

    const rows = clean.map((p) => ({
      aula_id,
      ordem: ordem++,
      tipo: "flashcard",
      payload: p,
      resposta_correta: null,
      markdown: null,
    }));

    if (rows.length > 0) {
      const { error: iErr } = await admin.from("aprender_blocos").insert(rows);
      if (iErr) throw iErr;
    }

    return json({ ok: true, total: rows.length });
  } catch (e: any) {
    console.error("[gerar-flashcards-aula]", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
}
