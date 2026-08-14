// Edge function: explica um item de jurisprudência (tema/tese) usando IA (Lovable AI Gateway).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL = 'gemini-3.1-flash-lite';

interface Payload {
  titulo?: string;
  categoria?: string;
  tribunal?: string;
  numero_processo?: string;
  situacao?: string;
  tese?: string;
  ementa?: string;
  descricao?: string;
  lei?: string;
  artigo?: string;
  modo?: string;
}

const SYSTEM = `Você é um professor de Direito brasileiro. Explique de forma DETALHADA, didática e completa um item de jurisprudência (tema, tese, súmula ou julgado) para um estudante ou operador do Direito.

FORMATO OBRIGATÓRIO (markdown, em português):
## Do que se trata
Resumo em 2-3 frases sobre o que essa jurisprudência decide.

## Contexto jurídico
Explique o instituto, o dispositivo legal envolvido e por que essa questão chegou ao tribunal. Se o usuário pesquisou um artigo específico, mostre a conexão entre o artigo pesquisado e os artigos citados no julgado (mesmo que sejam diferentes).

## O que o tribunal decidiu
Explique a tese fixada em linguagem clara, com exemplos práticos quando possível.

## Fundamentos e raciocínio
Principais argumentos jurídicos usados pelo tribunal (princípios, dispositivos, precedentes).

## Impacto prático
Consequências para advogados, juízes, réus/autores. Como aplicar no dia a dia.

## Pontos de atenção
Divergências, exceções, temas correlatos, ressalvas importantes.

REGRAS:
- Cite artigos no formato canônico: "art. 91 do CP", "art. 5º, XL, da CF", "Súmula 231 do STJ".
- Seja rico em detalhes mas objetivo. Sem enrolação.
- Não invente número de processo nem tese que não estejam no material fornecido.
- Se o julgado citar artigos diferentes do artigo pesquisado pelo usuário, EXPLIQUE explicitamente por que estão relacionados.`;

function buildUserPrompt(p: Payload): string {
  const parts: string[] = [];
  if (p.lei || p.artigo) parts.push(`**Pesquisa do usuário:** ${p.lei || ''} ${p.artigo ? '— art. ' + p.artigo : ''}`.trim());
  if (p.tribunal || p.categoria) parts.push(`**Origem:** ${[p.tribunal, p.categoria].filter(Boolean).join(' · ')}`);
  if (p.titulo) parts.push(`**Título:** ${p.titulo}`);
  if (p.numero_processo) parts.push(`**Processo/Referência:** ${p.numero_processo}`);
  if (p.situacao) parts.push(`**Situação:** ${p.situacao}`);
  if (p.tese) parts.push(`\n**TESE:**\n${p.tese}`);
  if (p.ementa) parts.push(`\n**EMENTA:**\n${p.ementa}`);
  if (p.descricao && !p.tese && !p.ementa) parts.push(`\n**Descrição:**\n${p.descricao}`);
  parts.push('\nAgora produza a resposta seguindo estritamente o formato pedido.');
  return parts.join('\n');
}

const SYSTEM_SUMULA_TABS = `Você é um professor de Direito brasileiro (voltado para preparação de alto nível e estudantes de Direito).
Seu objetivo é explicar de forma DETALHADA, didática e acessível uma Súmula ou Súmula Vinculante.

Você deve retornar APENAS UM OBJETO JSON válido com 3 propriedades: "explicacao", "exemplo" e "termos".
Cada campo deve conter texto formatado em Markdown. NÃO USE CITAÇÕES (blockquotes \`>\`) no texto principal para manter o estilo visual limpo, use apenas negrito e títulos \`###\`.

ESTRUTURA DO JSON:
{
  "explicacao": "## Do que se trata\\nResumo claro e direto do tema...\\n\\n## Contexto e Fundamentos\\nComo chegamos a essa súmula? O que a motivou? Como os tribunais raciocinaram?\\n\\n## Impacto Prático\\nO que muda na vida real ou no processo...",
  "exemplo": "## Caso Concreto\\nCrie uma situação hipotética (ex: 'João, um servidor público...') que ilustre PERFEITAMENTE a aplicação desta súmula.\\n\\n## Solução do Caso\\nAplicação da súmula no caso...",
  "termos": "## Glossário da Súmula\\n- **Termo 1:** Explicação super simples e jurídica.\\n- **Termo 2:** Explicação..."
}

REGRAS OBRIGATÓRIAS:
- Retorne APENAS o JSON válido.
- A "explicacao" deve focar na clareza. Use parágrafos curtos.
- O "exemplo" deve ser narrativo, como um caso de prova ou do cotidiano.
- Os "termos" devem destrinchar os jargões encontrados no enunciado (no mínimo 2 termos essenciais).
- Se a súmula estiver cancelada ou superada (se isso for notório), mencione na explicação.`;


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY ausente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const payload = (await req.json()) as Payload;
    if (!payload || (!payload.tese && !payload.ementa && !payload.descricao && !payload.titulo)) {
      return new Response(JSON.stringify({ error: 'Dados insuficientes para explicar.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: payload.modo === 'sumula-tabs' ? SYSTEM_SUMULA_TABS : SYSTEM },
          { role: 'user', content: buildUserPrompt(payload) },
        ],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('gateway err', resp.status, errBody);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de uso atingido. Tente novamente em alguns instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados no workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Falha na IA', status: resp.status, details: errBody }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const rawContent: string = data?.choices?.[0]?.message?.content ?? '';

    if (payload.modo === 'sumula-tabs') {
      try {
        let cleaned = rawContent.trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify({ data: parsed, model: MODEL }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Falha ao processar JSON da IA', details: rawContent }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ explicacao: rawContent, model: MODEL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});