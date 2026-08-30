// Edge function para gerar o grafo de conexões semânticas de um artigo usando a IA.
// Utiliza a mesma chave Gemini do restante do app e faz cache na tabela `visuais_juridicos`.

import { createClient } from "npm:@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/geminiFetch.ts";
import { MODELS } from "../_shared/ai-models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = MODELS.text;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 3000,
        responseMimeType: "application/json",
      },
    }),
  });

  const body = await res.text();
  if (!res.ok) {
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
    const body = await req.json().catch(() => null);
    const itemKeyBase = String(body?.item_key ?? "").trim(); // ex: leis_clt::482
    const artigoTexto = String(body?.artigo_texto ?? "").trim();
    const titulo = String(body?.titulo ?? "Artigo").trim();

    if (!itemKeyBase) return json({ error: "item_key é obrigatório" }, 400);
    if (!artigoTexto) return json({ error: "artigo_texto é obrigatório" }, 400);

    const itemKey = itemKeyBase + "_grafo";
    const tipo = "diagrama"; // usar diagrama para passar no check constraint
    const categoria = "leis";

    // 1. Tenta recuperar do cache global
    const { data: existente } = await admin
      .from("visuais_juridicos")
      .select("id, conteudo, views")
      .eq("tipo", tipo)
      .eq("categoria", categoria)
      .eq("item_key", itemKey)
      .maybeSingle();

    if (existente) {
      return json({ grafo: existente.conteudo, cached: true });
    }

    // 2. Se não existir, gera via IA
    const prompt = `
Você é um especialista em estruturação de dados jurídicos. Sua tarefa é extrair um mapa de conexões (Nós e Arestas) a partir do texto do dispositivo legal fornecido.
Isso será usado para renderizar um Grafo interativo para estudantes de direito.

TEXTO DO DISPOSITIVO:
"${titulo}"
${artigoTexto}

REGRAS:
1. Retorne APENAS um JSON estrito. NENHUM texto fora do JSON. NENHUM markdown.
2. O JSON deve ter este formato:
{
  "nodes": [
    {
      "id": "node_central", // ID único (use camelCase curto)
      "label": "TÍTULO CURTO", // O rótulo que aparecerá na bolha (ex: "Art. 482 CLT", "Justa Causa")
      "type": "central" // Pode ser: "central", "conceito", "consequencia", "excecao", "lei_relacionada", "requisito", "procedimento"
    }
  ],
  "edges": [
    {
      "source": "id_do_no_origem",
      "target": "id_do_no_destino",
      "label": "Rótulo curto da seta (ex: 'gera', 'exceto', 'depende de', 'define')",
      "description": "Explicação rica, completa e detalhada (2 a 3 frases) sobre a relação, aprofundando o conceito."
    }
  ]
}

3. O "node_central" DEVE ser o próprio artigo em questão e só deve haver 1 node do tipo "central".
4. SEJA ENXUTO E DIRETO: Crie no máximo 4 a 7 nós para mapear apenas a essência do artigo. Não crie nós desnecessários. Mantenha a estrutura visual limpa.
5. Os 'labels' dos nodes devem ser muito curtos (máx 2-3 palavras). Toda a complexidade e detalhamento jurídico DEVE ficar na 'description' das setas, que será exibida quando o usuário clicar para ler.
    `.trim();

    let conteudo = null;
    let ultimoErro = "";
    for (let tentativa = 0; tentativa < 2 && !conteudo; tentativa++) {
      try {
        const raw = await callGemini(prompt);
        const parsed = parseJsonLoose(raw);
        if (parsed?.nodes && parsed?.edges && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          conteudo = parsed;
        } else {
          ultimoErro = "O JSON não possui as propriedades obrigatórias nodes e edges como arrays.";
        }
      } catch (e) {
        ultimoErro = e instanceof Error ? e.message : String(e);
      }
    }

    if (!conteudo) {
      return json({ error: `Falha ao gerar o grafo: ${ultimoErro}` }, 502);
    }

    // 3. Salva no banco (cache)
    const { data: inserido, error: insertError } = await admin
      .from("visuais_juridicos")
      .upsert(
        {
          tipo,
          categoria,
          item_key: itemKey,
          item_label: titulo,
          titulo: `Grafo de Conexões: ${titulo}`,
          conteudo,
          modelo: MODEL,
        },
        { onConflict: "tipo,categoria,item_key" }
      )
      .select("id, conteudo")
      .single();

    if (insertError) throw insertError;

    // Tentativa de log (opcional)
    try {
      const { logAiCall } = await import("../_shared/ai-log.ts");
      await logAiCall({
        functionName: "grafo-conexoes-gerar",
        kind: "text",
        model: MODEL,
        triggerType: "manual",
        success: true,
      } as any);
    } catch { /* ignore */ }

    return json({ grafo: inserido.conteudo, cached: false });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e));
    console.error("grafo-conexoes-gerar:", msg);
    return json({ error: msg }, 500);
  }
});
