// Gera os recursos de IA de uma questão (comentário, alternativas erradas, mini-aula,
// flashcards, lei seca, pegadinhas, mapa mental, Cornell, termos) com cache no banco.
// Body: { questaoId?: string, questao?: QuestaoInline, tipo: AcaoTipo, forcar?: boolean }
import { corsHeaders, json, adminClient } from "../_shared/questoes-sheets.ts";

const GATEWAY = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL = "gemini-3.1-flash-lite";

type Tipo =
  | "comentario" | "lei-erradas" | "aula" | "flashcards"
  | "lei" | "pegadinhas" | "mapa" | "cornell" | "termos";

const TIPOS: Tipo[] = [
  "comentario", "lei-erradas", "aula", "flashcards",
  "lei", "pegadinhas", "mapa", "cornell", "termos",
];

const BASE = `Você é professor de cursinho jurídico especialista em concursos e OAB.
Responda SEMPRE em português do Brasil, com precisão técnica e linguagem direta.
Responda APENAS com o JSON pedido, sem texto fora do JSON.`;

const INSTRUCOES: Record<Tipo, string> = {
  comentario: `Comente a questão. Use o comentário original (quando houver) como base, reescrevendo de forma didática e correta.
O campo "texto" deve ser MARKDOWN rico e bem formatado, com:
- **negrito** nos termos e conclusões decisivas;
- uma citação em bloco (> ...) com o dispositivo legal/súmula transcrito ou parafraseado;
- pelo menos um aviso destacado começando com emoji, ex.: "⚠️ **Atenção:** ..." ou "✅ **Regra:** ..." ou "💡 **Dica:** ...";
- listas com "-" quando houver requisitos/exceções;
- parágrafos curtos separados por linha em branco.
Nunca use títulos de nível 1 e não use tabelas.
JSON: { "texto": "markdown de 150-300 palavras conforme as regras acima", "fundamento": "artigo/súmula/jurisprudência principal ou string vazia", "dica": "dica de prova curta" }`,
  "lei-erradas": `Explique, uma a uma, TODAS as alternativas que NÃO são o gabarito — sem exceção e sem pular nenhuma.
Regras obrigatórias:
- Se a questão tem alternativas A a E, retorne 4 objetos (todas menos a correta); se tem A a D, retorne 3; se for Certo/Errado, retorne 1 (a assertiva oposta ao gabarito).
- Mantenha a ordem alfabética das letras.
- O campo "motivo" deve ser markdown curto com **negrito** no erro central (2 a 4 frases), explicando exatamente por que aquela alternativa está errada e qual seria o correto.
JSON: { "erradas": [ { "letra": "A", "texto": "texto resumido da alternativa", "motivo": "markdown de 2 a 4 frases explicando o erro", "dispositivo_chave": "art. X da Lei Y ou string vazia" } ] }`,

  aula: `Crie uma mini-aula com o conteúdo cobrado na questão.
JSON: { "slides": [ { "titulo": "...", "conteudo": "2 a 5 frases em markdown simples" } ] } — de 4 a 6 slides.`,
  flashcards: `Crie flashcards de revisão a partir da questão.
JSON: { "cards": [ { "frente": "pergunta curta", "verso": "resposta objetiva" } ] } — de 4 a 8 cartões.`,
  lei: `Traga a lei seca aplicável à questão.
JSON: { "dispositivos": [ { "referencia": "Art. 121, §2º, CP", "texto": "transcrição fiel ou o mais próxima possível", "comentario": "1 a 2 frases de aplicação" } ] } — de 1 a 4 dispositivos.`,
  pegadinhas: `Liste as pegadinhas de banca envolvidas no tema da questão.
JSON: { "pegadinhas": [ { "titulo": "...", "texto": "2 a 4 frases" } ] } — de 3 a 5 itens.`,
  mapa: `Crie um mapa mental hierárquico do tema.
JSON: { "markdown": "lista markdown aninhada com no máximo 3 níveis" }`,
  cornell: `Crie um resumo no método Cornell.
JSON: { "perguntas": ["..."], "notas": "markdown com as anotações", "sintese": "3 a 5 frases de síntese" }`,
  termos: `Explique o vocabulário jurídico da questão.
JSON: { "termos": [ { "termo": "...", "definicao": "1 a 3 frases", "exemplo": "exemplo curto ou string vazia" } ] } — de 3 a 6 termos.`,
};

function alternativas(q: any) {
  return [["A", q.alt_a ?? q.a], ["B", q.alt_b ?? q.b], ["C", q.alt_c ?? q.c], ["D", q.alt_d ?? q.d], ["E", q.alt_e ?? q.e]]
    .filter(([, v]) => v)
    .map(([l, v]) => `${l}) ${v}`)
    .join("\n");
}

function montarPrompt(q: any) {
  return [
    q.disciplina || q.area ? `Disciplina/área: ${q.disciplina ?? q.area}` : "",
    q.assunto || q.tema ? `Assunto: ${q.assunto ?? q.tema}` : "",
    q.subtema ? `Subtema: ${q.subtema}` : "",
    q.banca ? `Banca: ${q.banca}${q.ano ? ` (${q.ano})` : ""}` : "",
    q.texto_associado ? `Texto associado:\n${q.texto_associado}` : "",
    `\nEnunciado:\n${q.enunciado}`,
    `\nAlternativas:\n${alternativas(q)}`,
    `\nGabarito oficial: ${q.gabarito_oficial ?? q.gabarito ?? q.correta ?? "não informado"}`,
    q.gabarito_comentado || q.comentario ? `\nComentário original (base):\n${q.gabarito_comentado ?? q.comentario}` : "",
  ].filter(Boolean).join("\n");
}

function hashChave(texto: string) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (Math.imul(h, 31) + texto.charCodeAt(i)) | 0;
  return `h:${h}`;
}

const FALLBACK_MODEL = "gemini-2.5-flash-lite";
const MAX_RETRIES = 3;

async function chamarApi(model: string, tipo: Tipo, questao: any) {
  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get('GEMINI_API_KEY')}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      ...(model.startsWith("openai/") ? { reasoning_effort: "none" } : {}),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${BASE}\n\n${INSTRUCOES[tipo]}` },
        { role: "user", content: montarPrompt(questao) },
      ],
    }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`[${r.status}] ${txt.slice(0, 400)}`);
  const data = JSON.parse(txt);
  const raw = (data.choices?.[0]?.message?.content ?? "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Resposta da IA não é JSON válido");
  }
}

async function gerar(tipo: Tipo, questao: any) {
  const modelos = [MODEL, FALLBACK_MODEL];
  for (const modelo of modelos) {
    for (let tentativa = 0; tentativa < MAX_RETRIES; tentativa++) {
      try {
        return await chamarApi(modelo, tipo, questao);
      } catch (e) {
        const msg = String((e as Error)?.message ?? "");
        const isOverloaded = msg.includes("overloaded") || msg.includes("503") || msg.includes("529") || msg.includes("rate");
        if (isOverloaded && tentativa < MAX_RETRIES - 1) {
          const delay = 1000 * (tentativa + 1);
          console.warn(`[questao-acao-ia] ${modelo} tentativa ${tentativa + 1} falhou (overloaded), retry em ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        if (isOverloaded) {
          console.warn(`[questao-acao-ia] ${modelo} esgotou retries, tentando próximo modelo`);
          break; // tenta o próximo modelo
        }
        throw e; // erro não-recuperável, lança imediatamente
      }
    }
  }
  throw new Error("Todos os modelos estão indisponíveis no momento. Tente novamente em alguns segundos.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const tipo = String(body?.tipo ?? "") as Tipo;
    if (!TIPOS.includes(tipo)) return json({ error: "tipo inválido" }, 400);

    const admin = adminClient();
    let questao: any = body?.questao ?? null;
    let chave = "";

    if (body?.questaoId) {
      const { data } = await admin.from("questoes").select("*").eq("id", body.questaoId).maybeSingle();
      if (!data) return json({ error: "Questão não encontrada" }, 404);
      questao = data;
      chave = `q:${data.id}`;
    } else {
      if (!questao?.enunciado) return json({ error: "questao ou questaoId obrigatório" }, 400);
      chave = hashChave(String(questao.enunciado));
    }

    // Versão do prompt: invalida cache antigo de comentário/alternativas erradas.
    if (tipo === "comentario" || tipo === "lei-erradas") chave = `${chave}|v2`;


    if (!body?.forcar) {
      const { data: cache } = await admin
        .from("questoes_acoes_cache")
        .select("payload")
        .eq("chave", chave)
        .eq("tipo", tipo)
        .maybeSingle();
      if (cache?.payload) return json({ ok: true, payload: cache.payload, cache: true });
    }

    const payload = await gerar(tipo, questao);

    const { error: upErr } = await admin
      .from("questoes_acoes_cache")
      .upsert({ chave, tipo, payload }, { onConflict: "chave,tipo" });
    if (upErr) console.error("[questao-acao-ia] cache", upErr.message);

    // O comentário também alimenta a coluna da questão, quando ela existe no banco.
    if (tipo === "comentario" && body?.questaoId && payload?.texto) {
      await admin.from("questoes")
        .update({ comentario_ia: payload.texto, comentario_ia_gerado_em: new Date().toISOString() })
        .eq("id", body.questaoId);
    }

    return json({ ok: true, payload, cache: false });
  } catch (e) {
    console.error("[questao-acao-ia]", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
