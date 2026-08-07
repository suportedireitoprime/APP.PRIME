import { corsHeaders } from '../_shared/cors.ts';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const MODEL = 'google/gemini-3.6-flash';

const SYSTEM_PROMPT = `Você é um doutrinador e professor especialista em Direito Brasileiro (OAB e Concursos de Alto Nível).
Com base no Flashcard fornecido (Pergunta, Resposta Explicada, Área e Tema), crie um RESUMO NO MÉTODO CORNELL completo, altamente didático e direto ao ponto.

Responda ESTRITAMENTE em JSON válido, sem qualquer texto ou markdown em volta do JSON:
{
  "pontos_chave": ["Palavra-chave 1", "Conceito Chave 2", "Artigo/Princípio Chave 3"],
  "notas_explicativas": "Explicação aprofundada em 2 a 3 parágrafos curtos detalhando a lógica jurídica, requisitos e aplicação prática.",
  "exemplos_praticos": "Exemplo concreto do dia a dia da advocacia ou jurisprudência consolidada (STF/STJ) ilustrando a pergunta.",
  "sintese_final": "Conclusão e regra de ouro em 2 frases para memorização definitiva."
}
Linguagem jurídica impecável, clara e objetiva.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'Chave de API de IA não configurada' }, 500);

    const body = await req.json().catch(() => ({}));
    const pergunta = typeof body?.pergunta === 'string' ? body.pergunta.trim() : '';
    const resposta = typeof body?.resposta === 'string' ? body.resposta.trim() : '';
    const area = typeof body?.area === 'string' ? body.area.trim() : 'Direito';
    const tema = typeof body?.tema === 'string' ? body.tema.trim() : 'Geral';

    if (!pergunta || !resposta) {
      return json({ error: 'Pergunta e resposta são obrigatórias' }, 400);
    }

    const userPrompt = `Área: ${area}\nTema: ${tema}\nPergunta do Card: ${pergunta}\nResposta Oficial: ${resposta}`;

    const resp = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Erro na API de IA:', errText);
      return json({ error: 'Não foi possível gerar o resumo Cornell no momento' }, 500);
    }

    const rawData = await resp.json();
    const rawContent = rawData.choices?.[0]?.message?.content || '';

    // Extrair JSON do retorno
    let parsed = null;
    try {
      const cleanJson = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Falha ao dar parse no JSON do Gemini, estruturando fallback', e);
      parsed = {
        pontos_chave: [area, tema],
        notas_explicativas: rawContent || resposta,
        exemplos_praticos: 'Consulte a jurisprudência aplicável ao tema.',
        sintese_final: resposta.slice(0, 150),
      };
    }

    return json({ cornell: parsed });
  } catch (err: any) {
    console.error('Exceção na Edge Function gerar-resumo-cornell-card:', err);
    return json({ error: err.message || 'Erro interno' }, 500);
  }
});
