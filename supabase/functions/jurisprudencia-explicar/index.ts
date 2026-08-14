// Edge function: explica jurisprudência e súmulas usando IA
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { geminiFetch } from '../_shared/geminiFetch.ts';

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
  sumulaId?: string;
  numero?: number | string;
  enunciado?: string;
  precedentes?: string;
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
- Não invente número de processo nem tese que não estejam no material fornecido.`;

const SYSTEM_SUMULA_TABS = `Você é um professor de Direito brasileiro de altíssimo nível.
Seu objetivo é explicar de forma DETALHADA, didática, fluida e acessível uma Súmula ou Súmula Vinculante para as abas do aplicativo jurídico.

Você DEVE retornar APENAS UM OBJETO JSON válido com exatamente estas 3 propriedades: "explicacao", "exemplo" e "termos".
Cada campo deve conter texto formatado em Markdown com títulos ### e tópicos explicativos. Não use blocos de citação (>) no texto principal.

ESTRUTURA DO JSON:
{
  "explicacao": "### 🎯 Do que se trata\\nResumo claro e direto do entendimento fixado...\\n\\n### 🏛️ Contexto e Fundamentos\\nPor que essa súmula foi editada e como o tribunal fundamentou esse posicionamento?\\n\\n### ⚡ Impacto Prático\\nO que muda na prática jurídica e nos processos judiciais...",
  "exemplo": "### 📖 Caso Concreto Prático\\nCrie uma situação hipotética realista que ilustre com perfeição a aplicação desta súmula.\\n\\n### ⚖️ Solução do Caso\\nExplique passo a passo como o juiz ou tribunal aplica a súmula para solucionar a controvérsia...",
  "termos": "### 📚 Glossário e Conceitos-Chave\\n- **Termo Principal 1:** Conceito e significado prático.\\n- **Termo Principal 2:** Conceito e significado prático."
}

REGRAS OBRIGATÓRIAS:
- Retorne APENAS o JSON puro.
- A "explicacao" deve ser rica, clara e profunda.
- O "exemplo" deve ter começo, meio e fim (com nomes, fatos e desfecho).
- Os "termos" devem explicar no mínimo 2 a 3 termos jurídicos relevantes presentes na súmula.`;

function buildUserPrompt(p: Payload): string {
  const parts: string[] = [];
  if (p.modo === 'sumula-tabs') {
    parts.push(`**SÚMULA / TRIBUNAL:** ${p.tribunal || 'STF'} - Súmula nº ${p.numero || p.titulo || ''}`);
    if (p.enunciado) parts.push(`\n**ENUNCIADO DA SÚMULA:**\n${p.enunciado}`);
    if (p.precedentes) parts.push(`\n**PRECEDENTES / OBSERVAÇÕES:**\n${p.precedentes}`);
    parts.push('\nGere a explicação, exemplo e termos em formato JSON estrito conforme instruído.');
    return parts.join('\n');
  }

  if (p.lei || p.artigo) parts.push(`**Pesquisa do usuário:** ${p.lei || ''} ${p.artigo ? '— art. ' + p.artigo : ''}`.trim());
  if (p.tribunal || p.categoria) parts.push(`**Origem:** ${[p.tribunal, p.categoria].filter(Boolean).join(' · ')}`);
  if (p.titulo) parts.push(`**Título:** ${p.titulo}`);
  if (p.numero_processo) parts.push(`**Processo/Referência:** ${p.numero_processo}`);
  if (p.situacao) parts.push(`**Situação:** ${p.situacao}`);
  if (p.enunciado) parts.push(`\n**ENUNCIADO:**\n${p.enunciado}`);
  if (p.tese) parts.push(`\n**TESE:**\n${p.tese}`);
  if (p.ementa) parts.push(`\n**EMENTA:**\n${p.ementa}`);
  if (p.descricao && !p.tese && !p.ementa && !p.enunciado) parts.push(`\n**Descrição:**\n${p.descricao}`);
  parts.push('\nAgora produza a resposta seguindo estritamente o formato pedido.');
  return parts.join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_AUDIO_API_KEY') || Deno.env.get('GEMINI_API_KEY_RESERVA') || '';
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY ausente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as Payload;
    const hasData = payload && (
      payload.tese || payload.ementa || payload.descricao || 
      payload.titulo || payload.enunciado || payload.numero
    );

    if (!hasData) {
      return new Response(JSON.stringify({ error: 'Dados insuficientes para explicar.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = payload.modo === 'sumula-tabs' ? SYSTEM_SUMULA_TABS : SYSTEM;
    const userPrompt = buildUserPrompt(payload);
    const isJsonMode = payload.modo === 'sumula-tabs';

    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];
    let lastError = '';
    let rawContent = '';

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiBody: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2500,
        }
      };

      if (isJsonMode) {
        geminiBody.generationConfig.responseMimeType = 'application/json';
      }

      try {
        const resp = await geminiFetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        });

        if (resp.ok) {
          const data = await resp.json();
          rawContent = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('\n').trim() || '';
          if (rawContent) break;
        } else {
          lastError = await resp.text().catch(() => '');
          console.warn(`[jurisprudencia-explicar] Modelo ${model} retornou ${resp.status}: ${lastError}`);
        }
      } catch (err) {
        lastError = String((err as Error)?.message || err);
        console.warn(`[jurisprudencia-explicar] Erro de rede com ${model}:`, err);
      }
    }

    if (!rawContent) {
      return new Response(JSON.stringify({ error: 'Falha ao processar com a IA', details: lastError }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isJsonMode) {
      try {
        let cleaned = rawContent.trim()
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify({ data: parsed }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (_err) {
        // Fallback por regex
        const explicacaoMatch = rawContent.match(/"explicacao"\s*:\s*"([\s\S]*?)(?<!\\)"/);
        const exemploMatch = rawContent.match(/"exemplo"\s*:\s*"([\s\S]*?)(?<!\\)"/);
        const termosMatch = rawContent.match(/"termos"\s*:\s*"([\s\S]*?)(?<!\\)"/);

        if (explicacaoMatch) {
          return new Response(JSON.stringify({
            data: {
              explicacao: explicacaoMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
              exemplo: exemploMatch ? exemploMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '',
              termos: termosMatch ? termosMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : ''
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          data: {
            explicacao: rawContent,
            exemplo: '',
            termos: ''
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ explicacao: rawContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Erro na Edge Function jurisprudencia-explicar:', e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});