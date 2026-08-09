// Gera as AUDIOAULAS de um livro a partir do texto extraído (leitura nativa).
// A IA agrupa partes fragmentadas do sumário, melhora os títulos e escreve o
// prompt de podcast (2 apresentadores) pronto para copiar.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAILS = new Set([
  "wn7corporation@gmail.com",
  "suporte.vacatio@gmail.com",
  "wn7juridico@gmail.com",
]);

const MODEL = "gemini-3.1-flash-lite";
const VERSION = "audioaulas-gerar-v1";

const SYSTEM_PROMPT = `Você é um curador de conteúdo que transforma livros jurídicos em uma série de AUDIOAULAS (aula explicativa narrada por um professor).

Regras:
1. Analise o SUMÁRIO e o CONTEÚDO e defina de 6 a 20 audioaulas.
2. UNIFIQUE partes fragmentadas: "Parte 1", "Parte 2", "continuação", "cap. 3.1 / 3.2" do MESMO assunto viram UMA aula só.
3. MELHORE a nomenclatura do título para o formato audioaula: claro, didático, atraente, em PT-BR, máximo 80 caracteres, sem numeração dentro do título.
4. Escreva um resumo de 2 a 3 frases do que a aula deve cobrir.
5. Liste de 4 a 8 tópicos objetivos que a aula deve abordar, na ordem.
6. Liste as BASES LEGAIS que aparecem no conteúdo e pertencem à aula (artigos, incisos, súmulas, leis, dispositivos constitucionais). Se não houver, devolva lista vazia.
7. Ordene do introdutório ao avançado.

Responda EXATAMENTE com este JSON, sem texto extra:
{
  "tema": "tema geral do curso, ex: Noções Gerais de Direito Penal",
  "aulas": [
    { "ordem": 1, "titulo": "string", "resumo": "2-3 frases", "topicos": ["string"], "bases_legais": ["art. 121 do Código Penal"] }
  ]
}`;

function montarPrompt(opts: {
  tema: string;
  numero: number;
  titulo: string;
  resumo: string;
  topicos: string[];
  basesLegais: string[];
}) {
  const { tema, numero, titulo, resumo, topicos, basesLegais } = opts;
  return `Aula ${numero} — "${titulo}" | Tema: ${tema}

Abra dizendo que é hora de aprender e já entre no foco do tema, despertando a curiosidade. Apresente o tema "${titulo}" dentro de ${tema}. Explique com linguagem cativante, mostrando os "porquês" de cada regra. Use sempre exemplos práticos. Tom dinâmico, natural e empolgante, como um professor explicando de verdade.

O que a aula cobre: ${resumo}

Siga esta ordem:
${topicos.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Regras:
- Esclareça termos, artigos e abreviações jurídicas com a pronúncia correta.
- Se houver base legal no texto, cite-a; não invente números de dispositivos.${basesLegais.length ? `\n- Bases legais presentes no conteúdo: ${basesLegais.join("; ")}.` : ""}
- Não cite livro, apostila, autor ou qualquer material de origem.
- Nunca use "imagine que...".
- Reforce com dicas de estudo ao longo da aula.
- No fim: revise o conteúdo, faça questões comentadas, dê dicas para quem precisa aprender o tema em 24h antes da prova e encerre com uma despedida cordial.`;

}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = requireEnv("SUPABASE_URL");
    const SERVICE_ROLE = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
    const GEMINI_API_KEY = requireEnv("GEMINI_API_KEY").trim();

    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "não autenticado" }, 401);
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userRes } = await authClient.auth.getUser();
    const email = userRes?.user?.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.has(email)) return json({ error: "apenas administradores" }, 403);

    const body = await req.json().catch(() => ({}));
    if (body?.__healthcheck === true) return json({ ok: true, model: MODEL, version: VERSION });

    const livroId = String(body?.livro_id ?? "").trim();
    const livroTabela = String(body?.livro_tabela ?? "biblioteca_estudos").trim();
    if (!livroId) return json({ error: "livro_id obrigatório" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: livroInfo } = await admin
      .from("biblioteca_estudos")
      .select("id, tema, area, capa_livro, sobre")
      .eq("id", Number(livroId))
      .maybeSingle();
    if (!livroInfo) return json({ error: "livro não encontrado em Áreas do Direito" }, 404);

    const { data: nativa } = await admin
      .from("biblioteca_leitura_nativa")
      .select("id, sumario_json, capitulos_json, conteudo_md, conteudo_md_refinado, status, refino_status")
      .eq("livro_tabela", livroTabela)
      .eq("livro_id", livroId)
      .maybeSingle();

    const conteudoBase = String(nativa?.conteudo_md_refinado || nativa?.conteudo_md || "");
    if (conteudoBase.trim().length < 300) {
      return json({ error: "Este livro ainda não tem texto extraído (leitura nativa)." }, 400);
    }

    const sumario = nativa?.capitulos_json || nativa?.sumario_json || null;
    const conteudo = conteudoBase.slice(0, 45000);
    const temaLivro = String(livroInfo.tema || "").trim();
    const area = String(livroInfo.area || "").trim() || "Geral";

    const userContent = [
      `TEMA DO MATERIAL: ${temaLivro}`,
      `ÁREA DO DIREITO: ${area}`,
      "",
      sumario ? `SUMÁRIO (JSON):\n${JSON.stringify(sumario).slice(0, 8000)}` : "SUMÁRIO: (não estruturado)",
      "",
      "CONTEÚDO (trecho):",
      conteudo,
    ].join("\n");

    let parsed: { tema?: string; aulas?: any[] } = {};
    let diag = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: userContent }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json",
              maxOutputTokens: 32768,
              // sem "thinking": senão o orçamento de tokens é gasto e a resposta volta vazia
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        },
      );
      if (aiRes.status === 429) {
        diag = "limite de requisições do Gemini (429)";
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      if (!aiRes.ok) {
        const detail = await aiRes.text().catch(() => "");
        return json({ error: `Gemini falhou (HTTP ${aiRes.status}). ${detail.slice(0, 300)}` }, 502);
      }
      const aiJson = await aiRes.json();
      const cand = aiJson?.candidates?.[0];
      const finish = cand?.finishReason ?? aiJson?.promptFeedback?.blockReason ?? "sem candidato";
      const text = cand?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
      try { parsed = JSON.parse(text || "{}"); } catch { parsed = {}; }
      if (Array.isArray(parsed.aulas) && parsed.aulas.length) break;
      diag = `finishReason=${finish}; resposta=${String(text).slice(0, 200)}`;
      console.error("[audioaulas-gerar] tentativa sem aulas:", diag);
    }

    const aulas = Array.isArray(parsed.aulas) ? parsed.aulas : [];
    if (!aulas.length) return json({ error: `A IA não retornou aulas. ${diag}` }, 502);


    const tema = String(parsed.tema || temaLivro || area);

    // upsert do curso
    const { data: cursoExistente } = await admin
      .from("audioaulas_cursos")
      .select("id")
      .eq("livro_tabela", livroTabela)
      .eq("livro_id", livroId)
      .maybeSingle();

    const cursoPayload = {
      area,
      livro_id: livroId,
      livro_tabela: livroTabela,
      titulo: tema,
      descricao: livroInfo.sobre ? String(livroInfo.sobre).slice(0, 1000) : null,
      capa_url: livroInfo.capa_livro ?? null,
      total_aulas: aulas.length,
      gerado_em: new Date().toISOString(),
    };

    let cursoId = cursoExistente?.id as string | undefined;
    if (cursoId) {
      await admin.from("audioaulas_cursos").update(cursoPayload).eq("id", cursoId);
    } else {
      const { data: novo, error: cErr } = await admin
        .from("audioaulas_cursos")
        .insert(cursoPayload)
        .select("id")
        .single();
      if (cErr) throw cErr;
      cursoId = novo.id;
    }

    // preserva links de áudio já cadastrados (por número da aula)
    const { data: antigos } = await admin
      .from("audioaulas_itens")
      .select("numero, audio_url, publicado")
      .eq("curso_id", cursoId);
    const mapaAntigos = new Map((antigos ?? []).map((a: any) => [a.numero, a]));

    await admin.from("audioaulas_itens").delete().eq("curso_id", cursoId);

    // fatia o conteúdo proporcionalmente entre as aulas
    const fatia = Math.ceil(conteudoBase.length / aulas.length);

    const rows = aulas.map((a: any, i: number) => {
      const numero = Number(a.ordem ?? i + 1) || i + 1;
      const titulo = String(a.titulo || `Aula ${numero}`).slice(0, 200);
      const resumo = String(a.resumo || "").slice(0, 1500);
      const topicos: string[] = Array.isArray(a.topicos)
        ? a.topicos.map((t: any) => String(t)).slice(0, 10)
        : [];
      const basesLegais: string[] = Array.isArray(a.bases_legais)
        ? a.bases_legais.map((b: any) => String(b)).slice(0, 20)
        : [];
      const antigo = mapaAntigos.get(numero);
      return {
        curso_id: cursoId,
        numero,
        ordem: i + 1,
        titulo,
        resumo,
        prompt: montarPrompt({ tema, numero, titulo, resumo, topicos, basesLegais }),
        conteudo: conteudoBase.slice(i * fatia, (i + 1) * fatia),
        audio_url: antigo?.audio_url ?? null,
        publicado: Boolean(antigo?.audio_url),
      };
    });

    const { error: iErr } = await admin.from("audioaulas_itens").insert(rows);
    if (iErr) throw iErr;

    // espelha na planilha do Google Sheets (não bloqueia o retorno em caso de falha)
    let sheets: string | null = null;
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/audioaulas-sheets-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE}`,
          apikey: SERVICE_ROLE,
        },
        body: JSON.stringify({ curso_id: cursoId }),
      });
      if (!r.ok) sheets = `HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`;
    } catch (e: any) {
      sheets = String(e?.message ?? e);
    }

    return json({ ok: true, curso_id: cursoId, total: rows.length, tema, area, sheets_erro: sheets, version: VERSION });
  } catch (e: any) {
    console.error("[audioaulas-gerar]", e);
    return json({ error: String(e?.message ?? e), version: VERSION }, 500);
  }
});

function json(payload: unknown, status = 200) {
  if (status >= 400) console.error("[audioaulas-gerar] erro", status, JSON.stringify(payload).slice(0, 500));
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} ausente`);
  return value;
}
