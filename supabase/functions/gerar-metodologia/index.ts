// Gera metodologias de estudo (Cornell / Feynman) a partir de um resumo jurídico.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL = 'gemini-3.1-flash-lite';

const PROMPTS: Record<string, string> = {
  conceitos: `Você é um jurista e professor de Direito de elite no Brasil. Com base no Tema, Subtema e o TEXTO BÁSICO fornecidos, produza um RESUMO JURÍDICO APROFUNDADO, COMPLETO, EXTENSO E EXTREMAMENTE DIDÁTICO.
Não produza resumos superficiais ou curtos. Expanda substancialmente o conteúdo com:
1. Conceitos doutrinários consolidados e aprofundados, fundamentação jurídica expressa (artigos de lei e CF/88), princípios aplicáveis e requisitos legais.
2. Explicação da lógica e do propósito da norma com clareza para operadores do Direito e concurseiros.
3. Desdobramentos práticos, divergências doutrinárias, exceções à regra e súmulas/jurisprudência pacificada (STF/STJ) se aplicável ao tema.
4. Estrutura impecável com títulos limpos (##, ###), tópicos numerados ou com marcadores, destaques e alertas em blocos de citação (> [!NOTE], > [!IMPORTANT] ou > [!WARNING]).
5. Tabelas comparativas ou esquemas em markdown sempre que ajudarem na fixação.

Responda APENAS com JSON válido, sem markdown externo, no formato:
{
  "markdown": "Resumo completo, extenso e aprofundado em markdown...",
  "exemplos": "3 a 5 exemplos práticos minuciosos e contextualizados em markdown (casos concretos do cotidiano forense) que ilustrem perfeitamente a aplicação.",
  "termos": "Glossário robusto em markdown com 5 a 10 termos técnicos essenciais e suas definições explicativas completas."
}
Português do Brasil, rigor técnico e didática impecável.`,
  cornell: `Você é um professor de Direito brasileiro. Produza um estudo no MÉTODO CORNELL sobre o conteúdo enviado.
Responda APENAS com JSON válido, sem markdown, no formato:
{
  "palavras_chave": ["termo 1", "termo 2", ...],
  "perguntas": [{"pergunta": "...", "resposta": "..."}],
  "anotacoes": [{"topico": "...", "conteudo": "..."}],
  "resumo_geral": "..."
}
Use de 5 a 8 palavras-chave, 4 a 6 perguntas de revisão com respostas curtas, 4 a 7 anotações objetivas e um resumo-síntese de 3 a 5 frases. Português do Brasil, linguagem clara e técnica, cite artigos no formato canônico.`,
  feynman: `Você é um professor de Direito brasileiro. Produza um estudo no MÉTODO FEYNMAN sobre o conteúdo enviado.
Responda APENAS com JSON válido, sem markdown, no formato:
{
  "conceito": "...",
  "explicacao_simples": "...",
  "lacunas": [{"ponto": "...", "explicacao": "..."}],
  "analogias": [{"analogia": "...", "relacao": "..."}],
  "revisao_final": "..."
}
A explicação simples deve ser como se fosse para alguém leigo. Use de 3 a 5 lacunas (pontos que costumam gerar confusão) e 2 a 4 analogias do cotidiano. Português do Brasil.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'GEMINI_API_KEY ausente' }, 500);

    const body = await req.json().catch(() => ({}));
    const resumoId = body?.resumo_id ? String(body.resumo_id) : '';
    const metodo = ['conceitos', 'cornell', 'feynman'].includes(body?.metodo) ? body.metodo : '';
    if (!resumoId || !metodo) return json({ error: 'resumo_id e metodo (conceitos|cornell|feynman) são obrigatórios' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const force = body?.force === true;

    if (!force) {
      const { data: existente } = await supabase
        .from('resumo_metodologias')
        .select('conteudo')
        .eq('resumo_id', resumoId)
        .eq('metodo', metodo)
        .maybeSingle();

      if (existente?.conteudo) {
        return json({ conteudo: existente.conteudo, cached: true });
      }
    }

    const { data: resumo, error: erroResumo } = await supabase
      .from('resumos_juridicos')
      .select('tema, subtema, area, markdown, exemplos, termos')
      .eq('id', resumoId)
      .maybeSingle();
    if (erroResumo || !resumo) return json({ error: 'Resumo não encontrado' }, 404);

    let material = '';
    if (metodo === 'conceitos') {
      material = [
        `Área: ${resumo.area}`,
        `Tema: ${resumo.tema}`,
        resumo.subtema ? `Subtema: ${resumo.subtema}` : '',
        '',
        resumo.markdown ? `TEXTO BÁSICO (Use como base para expandir e aprofundar):\n${resumo.markdown}` : '',
      ].filter(Boolean).join('\n').slice(0, 24000);
    } else {
      material = [
        `Área: ${resumo.area}`,
        `Tema: ${resumo.tema}`,
        resumo.subtema ? `Subtema: ${resumo.subtema}` : '',
        '',
        resumo.markdown || '',
        resumo.exemplos ? `\n\nExemplos:\n${resumo.exemplos}` : '',
        resumo.termos ? `\n\nTermos:\n${resumo.termos}` : '',
      ].filter(Boolean).join('\n').slice(0, 24000);
    }

    const resp = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: PROMPTS[metodo] },
          { role: 'user', content: material },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (resp.status === 429) return json({ error: 'Muitas solicitações. Tente novamente em instantes.' }, 429);
    if (resp.status === 402) return json({ error: 'Créditos de IA esgotados.' }, 402);
    if (!resp.ok) {
      const txt = await resp.text();
      console.error('gateway error', resp.status, txt);
      return json({ error: 'Falha ao gerar conteúdo', detalhe: txt }, 500);
    }

    const data = await resp.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? '';
    let conteudo: any;
    try {
      conteudo = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return json({ error: 'Resposta inválida da IA' }, 500);
      conteudo = JSON.parse(match[0]);
    }

    const { error: erroInsert } = await supabase
      .from('resumo_metodologias')
      .upsert({ resumo_id: resumoId, metodo, conteudo, updated_at: new Date().toISOString() }, { onConflict: 'resumo_id,metodo' });
    if (erroInsert) console.error('erro ao salvar metodologia', erroInsert);

    if (metodo === 'conceitos' && conteudo?.markdown) {
      const { error: erroUpdateResumo } = await supabase
        .from('resumos_juridicos')
        .update({
          markdown: conteudo.markdown,
          exemplos: conteudo.exemplos || null,
          termos: conteudo.termos || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resumoId);
      if (erroUpdateResumo) console.error('erro ao atualizar resumos_juridicos', erroUpdateResumo);
    }

    return json({ conteudo, cached: false });
  } catch (e) {
    console.error(e);
    return json({ error: 'Erro inesperado' }, 500);
  }
});
