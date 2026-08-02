// Lei Seca: gera os exercícios de UMA lição a partir do texto INTEGRAL dos artigos.
// Body: { licao_id: string, force?: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const MODEL = "google/gemini-3.6-flash";

function repairAndParseJson(raw: string): any | null {
  let s = (raw ?? "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const start = s.search(/[\{\[]/);
  if (start === -1) return null;
  s = s.slice(start);
  try {
    return JSON.parse(s);
  } catch { /* tenta reparar */ }
  for (let i = s.length; i > 0; i--) {
    try {
      return JSON.parse(s.slice(0, i));
    } catch { /* continua */ }
  }
  return null;
}

async function callAI(prompt: string): Promise<any> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`AI ${res.status}: ${txt.slice(0, 400)}`);
  const data = JSON.parse(txt);
  const out = data?.choices?.[0]?.message?.content ?? "";
  const parsed = repairAndParseJson(out);
  if (!parsed) throw new Error("JSON inválido retornado pela IA");
  return parsed;
}

function countIncisos(texto: string): number {
  const incisos = (texto.match(/\b(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\s*[-–—]/g) || []).length;
  const paragrafos = (texto.match(/§\s*\d/g) || []).length;
  return incisos + paragrafos;
}

function buildPrompt(leiNome: string, artigosTexto: Array<{ num: string; texto: string }>): string {
  const blocos = artigosTexto.map((a) => `Art. ${a.num} — ${a.texto}`).join("\n\n");
  const nums = artigosTexto.map((a) => a.num);
  const podeQualArtigo = nums.length >= 2;
  const totalIncisos = artigosTexto.reduce((acc, a) => acc + countIncisos(a.texto), 0);
  const minExercicios = Math.min(30, Math.max(12, 8 + totalIncisos));
  const maxExercicios = Math.min(36, minExercicios + 8);

  const temPena = /\b(reclus[aã]o|deten[çc][aã]o|multa|pena de|pris[aã]o)\b/i.test(blocos);
  const temPrazo = /\b(\d+\s*(dias|meses|anos|horas)|prazo de \d)/i.test(blocos);

  return `Você é um professor de Direito criando uma lição gamificada estilo Duolingo sobre a LEI SECA (texto literal) dos artigos abaixo da ${leiNome}.

ARTIGOS NA ÍNTEGRA (use TODO o conteúdo: caput, todos os parágrafos, todos os incisos e alíneas):
${blocos}

REGRAS GERAIS:
- Gere entre ${minExercicios} e ${maxExercicios} exercícios variados, todos baseados EXCLUSIVAMENTE no texto literal dos artigos acima.
- COBERTURA TOTAL: cada parágrafo, inciso e alínea deve aparecer em pelo menos um exercício.
- Misture os tipos abaixo em proporção equilibrada.
- Linguagem clara, sem emojis.
- Toda resposta deve poder ser justificada pela letra da lei.

TIPOS DE EXERCÍCIO (campo "tipo"):

1) "completar" — frase do artigo/inciso com uma palavra-chave substituída por "____". 4 alternativas, 1 correta.
{ "tipo":"completar", "artigo":"5", "enunciado":"Ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de ____.", "alternativas":["lei","decreto","ordem","costume"], "correta":0, "explicacao":"Princípio da legalidade." }

2) "sim_nao" — afirmação V/F sobre o artigo:
{ "tipo":"sim_nao", "artigo":"5", "afirmacao":"A casa é asilo inviolável do indivíduo.", "correta":true, "explicacao":"Art. 5º, XI." }

3) "ligar" — 4 pares conceito↔definição extraídos:
{ "tipo":"ligar", "artigo":"1", "pares":[{"a":"República","b":"forma de governo"},{"a":"Federativa","b":"forma de Estado"},{"a":"Brasil","b":"nome do país"},{"a":"Estado Democrático","b":"regime político"}] }

4) "organizar" — 5 a 10 palavras embaralhadas formando trecho exato:
{ "tipo":"organizar", "artigo":"5", "frase_correta":"todos são iguais perante a lei", "palavras":["a","lei","iguais","todos","perante","são"] }

5) "alternativas" — múltipla escolha sobre conteúdo do artigo:
{ "tipo":"alternativas", "artigo":"5", "enunciado":"Segundo o art. 5º, é livre a manifestação do pensamento, sendo vedado o:", "alternativas":["anonimato","direito de resposta","sigilo da fonte","pluralismo"], "correta":0, "explicacao":"Art. 5º, IV." }

6) "erro" — frase do artigo com 1 ou 2 palavras TROCADAS por opostos/sinônimos errados:
{ "tipo":"erro", "artigo":"5", "texto_correto":"todos são iguais perante a lei", "texto_alterado":"todos são diferentes perante a lei", "indice_erradas":[2], "explicacao":"O correto é 'iguais'." }

${podeQualArtigo ? `7) "qual_artigo" — TRECHO LITERAL e perguntar de qual artigo é. Opções DEVEM ser apenas números desta lição: ${JSON.stringify(nums)}.
{ "tipo":"qual_artigo", "artigo":"5", "trecho":"A casa é asilo inviolável do indivíduo.", "opcoes":["3","4","5","6"], "correta":2, "explicacao":"Inciso XI." }
` : ""}
8) "qual_inciso" — trecho LITERAL de um inciso/alínea/parágrafo, perguntando de qual inciso é, dentro do MESMO artigo. 4 opções.
{ "tipo":"qual_inciso", "artigo":"5", "trecho":"a casa é asilo inviolável do indivíduo", "opcoes":["X","XI","XII","XIII"], "correta":1, "explicacao":"Inciso XI do art. 5º." }

9) "classificar" — 4 a 6 itens distribuídos em DUAS categorias retiradas do(s) artigo(s).
{ "tipo":"classificar", "artigo":"6", "categoria_a":"direitos individuais", "categoria_b":"direitos sociais", "itens":[{"texto":"vida","grupo":"a"},{"texto":"educação","grupo":"b"}], "explicacao":"Art. 5º x Art. 6º." }

10) "caca_palavra" — trecho de 12-25 palavras com EXATAMENTE 1 palavra trocada por sinônimo errado.
{ "tipo":"caca_palavra", "artigo":"5", "texto_alterado":"todos são diferentes perante a lei, sem distinção de qualquer natureza", "palavra_errada":"diferentes", "palavra_correta":"iguais", "explicacao":"Art. 5º, caput." }

${temPrazo ? `11) "prazo_numero" — pergunta sobre prazo NUMÉRICO citado no artigo. 4 opções numéricas plausíveis.
{ "tipo":"prazo_numero", "artigo":"5", "enunciado":"Qual o prazo previsto?", "opcoes":["24 horas","48 horas","72 horas","5 dias"], "correta":1, "explicacao":"Conforme o dispositivo." }
` : ""}
${temPena ? `12) "pena" — pergunta sobre a PENA prevista para a conduta. 4 alternativas plausíveis.
{ "tipo":"pena", "artigo":"121", "conduta":"matar alguém", "opcoes":["reclusão, de 6 a 20 anos","reclusão, de 1 a 4 anos","detenção, de 3 meses a 1 ano","reclusão, de 12 a 30 anos"], "correta":0, "explicacao":"Art. 121, caput." }
` : ""}

OBRIGAÇÕES FINAIS:
${temPena ? "- Gere pelo menos 2 exercícios do tipo 'pena'." : ""}
${temPrazo ? "- Gere pelo menos 1 exercício do tipo 'prazo_numero'." : ""}
${podeQualArtigo ? "- Gere pelo menos 2 do tipo 'qual_artigo'." : ""}
- Pelo menos 1 'classificar' quando houver agrupamento natural.
- Pelo menos 1 'caca_palavra' por lição.

SAÍDA (JSON puro, sem markdown):
{ "exercicios": [ ...lista... ] }`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { licao_id, force = false } = await req.json();
    if (!licao_id) {
      return new Response(JSON.stringify({ error: "licao_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: licao, error } = await sb.from("lei_seca_licoes").select("*").eq("id", licao_id).single();
    if (error || !licao) throw new Error("Lição não encontrada");
    if (licao.exercicios && !force) {
      return new Response(JSON.stringify({ ok: true, cached: true, exercicios: licao.exercicios }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sb.from("lei_seca_jobs").upsert({ licao_id, status: "processando", iniciado_em: new Date().toISOString(), erro: null });

    const { data: trilha } = await sb
      .from("lei_seca_trilhas")
      .select("nome,lei_slug")
      .eq("slug", licao.trilha_slug)
      .single();
    if (!trilha) throw new Error("Trilha não encontrada");

    const { data: lei } = await sb.from("vade_mecum_leis").select("id").eq("slug", trilha.lei_slug).maybeSingle();
    if (!lei?.id) throw new Error(`Lei não encontrada no Vade Mecum: ${trilha.lei_slug}`);

    const nums: string[] = licao.artigos || [];
    const { data: artigos } = await sb
      .from("vade_mecum_artigos")
      .select("numero,texto")
      .eq("lei_id", lei.id)
      .in("numero", nums);

    const mapa = new Map<string, string>();
    (artigos ?? []).forEach((a: any) => mapa.set(String(a.numero), String(a.texto ?? "")));
    const artigosTexto = nums
      .map((n) => ({ num: n, texto: (mapa.get(n) ?? "").replace(/\s+/g, " ").trim() }))
      .filter((a) => a.texto.length > 0);
    if (!artigosTexto.length) throw new Error("Nenhum artigo encontrado para a lição");

    const result = await callAI(buildPrompt(trilha.nome, artigosTexto));
    const exercicios = Array.isArray(result?.exercicios) ? result.exercicios : null;
    if (!exercicios || exercicios.length < 5) throw new Error("Resposta da IA inválida ou muito curta");

    await sb
      .from("lei_seca_licoes")
      .update({ exercicios, gerado_em: new Date().toISOString(), status: "pronto", erro: null })
      .eq("id", licao_id);
    await sb.from("lei_seca_jobs").upsert({ licao_id, status: "concluido", finalizado_em: new Date().toISOString(), erro: null });

    return new Response(JSON.stringify({ ok: true, exercicios }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[lei-seca-gerar]", e);
    try {
      const sb = createClient(SUPABASE_URL, SERVICE_KEY);
      const body = await req.clone().json().catch(() => ({}));
      if (body?.licao_id) {
        await sb.from("lei_seca_licoes").update({ status: "erro", erro: e.message ?? String(e) }).eq("id", body.licao_id);
        await sb.from("lei_seca_jobs").upsert({
          licao_id: body.licao_id,
          status: "erro",
          finalizado_em: new Date().toISOString(),
          erro: e.message ?? String(e),
        });
      }
    } catch { /* ignore */ }
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
