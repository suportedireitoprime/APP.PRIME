// Gera o comentário didático da questão com IA, usando o gabarito comentado
// da planilha como base. Body: { questaoId } ou { limite, cargoId }.
import { corsHeaders, json, adminClient, exigirAdmin } from "../_shared/questoes-sheets.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

const SYSTEM = `Você é professor de cursinho jurídico e comenta questões de concurso.

Recebe uma questão (enunciado + alternativas + gabarito oficial) e, quando existir, o comentário original da fonte.
Use o comentário original como BASE e guia — não o copie: reescreva de forma didática, organizada e correta.

REGRAS:
- Comece pela resposta correta e o porquê dela, com fundamento legal (artigo/súmula/jurisprudência) quando cabível.
- Depois explique, em uma linha cada, por que as demais alternativas estão erradas.
- Termine com uma "Dica de prova" curta.
- Português do Brasil, tom direto, sem enrolação, entre 120 e 250 palavras.
- Se o comentário original contiver erro evidente, corrija silenciosamente.
- Responda em texto puro com quebras de linha. NÃO use markdown (nada de **, ##, -).`;

function montarPrompt(q: any) {
  const alts = [["A", q.alt_a], ["B", q.alt_b], ["C", q.alt_c], ["D", q.alt_d], ["E", q.alt_e]]
    .filter(([, v]) => v)
    .map(([l, v]) => `${l}) ${v}`)
    .join("\n");
  return [
    q.disciplina ? `Disciplina: ${q.disciplina}` : "",
    q.assunto ? `Assunto: ${q.assunto}` : "",
    q.banca ? `Banca: ${q.banca}${q.ano ? ` (${q.ano})` : ""}` : "",
    q.texto_associado ? `Texto associado:\n${q.texto_associado}` : "",
    `\nEnunciado:\n${q.enunciado}`,
    `\nAlternativas:\n${alts}`,
    `\nGabarito oficial: ${q.gabarito_oficial ?? "não informado"}`,
    q.gabarito_comentado ? `\nComentário original (base):\n${q.gabarito_comentado}` : "",
    q.comentario_curtido ? `\nComentário da comunidade:\n${q.comentario_curtido}` : "",
  ].filter(Boolean).join("\n");
}

async function comentar(q: any): Promise<string> {
  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY") ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: montarPrompt(q) },
      ],
    }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`[${r.status}] ${txt.slice(0, 400)}`);
  const data = JSON.parse(txt);
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const admin = adminClient();

    // ---- questão única (usada pelo app ao abrir a questão) ----
    if (body.questaoId) {
      const { data: q, error } = await admin
        .from("questoes").select("*").eq("id", body.questaoId).maybeSingle();
      if (error || !q) return json({ error: "Questão não encontrada" }, 404);
      if (q.comentario_ia && !body.forcar) return json({ ok: true, comentario: q.comentario_ia, cache: true });

      const comentario = await comentar(q);
      await admin.from("questoes")
        .update({ comentario_ia: comentario, comentario_ia_gerado_em: new Date().toISOString() })
        .eq("id", q.id);
      return json({ ok: true, comentario, cache: false });
    }

    // ---- lote (somente admin) ----
    const auth = exigirAdmin(req);
    if (!auth.ok) return auth.res;

    const limite = Math.min(Number(body.limite ?? 20), 50);
    let query = admin.from("questoes").select("*").is("comentario_ia", null).eq("ativo", true).limit(limite);
    if (body.cargoId) query = query.eq("cargo_id", body.cargoId);
    const { data: pendentes } = await query;

    let feitas = 0;
    let erros = 0;
    for (const q of pendentes ?? []) {
      try {
        const comentario = await comentar(q);
        await admin.from("questoes")
          .update({ comentario_ia: comentario, comentario_ia_gerado_em: new Date().toISOString() })
          .eq("id", q.id);
        feitas++;
      } catch (e) {
        erros++;
        console.error("comentario", q.id, String(e));
      }
    }

    const { count: restantes } = await admin
      .from("questoes").select("id", { count: "exact", head: true }).is("comentario_ia", null);

    return json({ ok: true, feitas, erros, restantes: restantes ?? 0 });
  } catch (e) {
    console.error("[questoes-comentario-ia]", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
