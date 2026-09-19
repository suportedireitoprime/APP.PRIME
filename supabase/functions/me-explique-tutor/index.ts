import { geminiFetch } from "../_shared/geminiFetch.ts";
import { parseJsonStrict, GatewayError } from "../_shared/videoaulaIa.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const GEMINI_MODEL = "gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return json({ error: "Corpo da requisição ausente." }, 400);
    }

    const { modo, livro, termo, lei, pergunta, historico } = body;

    let systemInstruction = `Você é o tutor "Me Explique" do aplicativo Direito Prime.
Sua missão fundamental é explicar qualquer conceito jurídico de forma ULTRA DIDÁTICA, COMO SE ESTIVESSE EXPLICANDO PARA UMA CRIANÇA DE 6 ANOS (ELI5).
Regras obrigatórias:
1. Elimine completamente o juridiquês vazio ou pedante. Traduza tudo para o português do dia a dia.
2. Use analogias cotidianas simples e memoráveis (ex: brinquedos emprestados, fila da merenda, vizinho cortando árvore, compra de figurinhas).
3. Seja amigável, acolhedor e empolgante.
4. Mantenha precisão jurídica absoluta (sem inventar leis ou alucinar).
5. Forneça perguntas inteligentes que o aluno pode tocar para explorar mais.
6. Devolva SEMPRE um JSON válido estritamente no schema solicitado.`;

    let prompt = "";

    if (modo === "livro") {
      const { titulo, autor, capituloTitulo, capituloNumero, sobre } = livro || {};
      prompt = `Explique este livro da biblioteca jurídica:
Livro: "${titulo || "Obra Jurídica"}"
Autor: "${autor || "Autor da Obra"}"
${capituloTitulo ? `Capítulo em foco: "${capituloNumero ? `Capítulo ${capituloNumero}: ` : ""}${capituloTitulo}"` : "Foco: Visão geral introdutória do livro completo"}
${sobre ? `Sinopse/Contexto da obra: ${sobre}` : ""}

Gere uma explicação para quem nunca leu esse livro entender na hora.
Formate a resposta em JSON com:
{
  "titulo": "Título simples e chamativo",
  "oQueSignifica": "Explicação básica do livro/capítulo em linguagem de 6 anos",
  "exemploPratico": "Exemplo do dia a dia ou analogia clara que resume o ensinamento",
  "termosDestrinchados": [
    { "termo": "Conceito chave do livro", "emPortuguesClaro": "Tradução simples" }
  ],
  "perguntasSugeridas": [
    "Pergunta 1 que o aluno pode fazer para tirar dúvida sobre o livro",
    "Pergunta 2",
    "Pergunta 3"
  ],
  "dicaOabConcurso": "Como este tema deste livro aparece em provas ou na vida do operador do Direito"
}`;
    } else if (modo === "termo") {
      const { nome, definicaoBase } = termo || {};
      prompt = `Explique este termo jurídico do dicionário:
Termo: "${nome || "Termo Jurídico"}"
${definicaoBase ? `Definição técnica de base: "${definicaoBase}"` : ""}

Explique o que isso significa como se estivesse explicando para uma criança de 6 anos.
Formate em JSON com:
{
  "titulo": "Significado de ${nome}",
  "oQueSignifica": "Explicação simples e desmistificada",
  "exemploPratico": "Uma historinha rápida e prática do cotidiano ilustrando a aplicação do termo",
  "termosDestrinchados": [
    { "termo": "${nome}", "emPortuguesClaro": "O significado em poucas palavras" }
  ],
  "perguntasSugeridas": [
    "Pergunta 1 relacionada a ${nome}",
    "Pergunta 2",
    "Pergunta 3"
  ],
  "dicaOabConcurso": "Dica de ouro de como esse termo costuma ser cobrado em questões da OAB"
}`;
    } else if (modo === "lei") {
      const { leiNome, artigoNumero, textoArtigo } = lei || {};
      prompt = `Explique este artigo de lei:
Lei: "${leiNome || "Legislação Brasileira"}"
Artigo: "Artigo ${artigoNumero}"
${textoArtigo ? `Texto oficial da lei: "${textoArtigo}"` : ""}

Destrinche esse artigo explicando para uma pessoa de 6 anos.
Formate em JSON com:
{
  "titulo": "Art. ${artigoNumero} de forma simples",
  "oQueSignifica": "Explicação parágrafo por parágrafo / regra geral sem juridiquês",
  "exemploPratico": "Exemplo prático de uma situação da vida real onde este artigo se aplica",
  "termosDestrinchados": [
    { "termo": "Palavra difícil contida no artigo", "emPortuguesClaro": "O que ela quer dizer" }
  ],
  "perguntasSugeridas": [
    "Pergunta prática sobre a aplicação deste artigo",
    "Pergunta sobre exceções ou detalhes",
    "Pergunta de fixação"
  ],
  "dicaOabConcurso": "Pegadinha clássica da banca ou como a OAB cobra este artigo"
}`;
    } else {
      // Modo Livre
      prompt = `O aluno fez uma pergunta livre sobre Direito:
Pergunta: "${pergunta || "O que é Direito?"}"
${historico?.length ? `Histórico recente da conversa:\n${JSON.stringify(historico)}` : ""}

Responda como se estivesse explicando para uma pessoa de 6 anos, com uma história ou exemplo prático cotidiano.
Formate em JSON com:
{
  "titulo": "Resposta Simples",
  "oQueSignifica": "Resposta didática, clara e objetiva",
  "exemploPratico": "Analogia ou caso prático para fixar",
  "termosDestrinchados": [
    { "termo": "Termo envolvido", "emPortuguesClaro": "Significado simples" }
  ],
  "perguntasSugeridas": [
    "Pergunta complementar 1",
    "Pergunta complementar 2",
    "Pergunta complementar 3"
  ],
  "dicaOabConcurso": "Relevância jurídica ou como isso é visto na prática forense/OAB"
}`;
    }

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1800,
        responseMimeType: "application/json",
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const res = await geminiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[me-explique-tutor] Erro Gemini:", res.status, errText);
      throw new GatewayError(res.status, `Falha na IA: ${errText.slice(0, 150)}`);
    }

    const geminiData = await res.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed = parseJsonStrict(rawText);

    return json({ sucesso: true, dados: parsed });
  } catch (e) {
    console.error("[me-explique-tutor] Exceção:", e);
    return json(
      {
        sucesso: false,
        error: (e as Error)?.message || "Erro inesperado ao gerar explicação.",
      },
      500
    );
  }
});
