// Gera metodologias de estudo (Cornell / Feynman) a partir de um resumo jurídico.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL = 'gemini-3.6-flash';

const PROMPTS: Record<string, string> = {
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
    if (!apiKey) return json({ error: 'LOVABLE_API_KEY ausente' }, 500);

    const body = await req.json().catch(() => ({}));
    const resumoId = typeof body?.resumo_id === 'string' ? body.resumo_id : '';
    const metodo = body?.metodo === 'cornell' || body?.metodo === 'feynman' ? body.metodo : '';
    if (!resumoId || !metodo) return json({ error: 'resumo_id e metodo (cornell|feynman) são obrigatórios' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: existente } = await supabase
      .from('resumo_metodologias')
      .select('conteudo')
      .eq('resumo_id', resumoId)
      .eq('metodo', metodo)
      .maybeSingle();
    if (existente?.conteudo) return json({ conteudo: existente.conteudo, cached: true });

    const { data: resumo, error: erroResumo } = await supabase
      .from('resumos_juridicos')
      .select('area, tema, subtema, markdown, exemplos, termos')
      .eq('id', resumoId)
      .maybeSingle();
    if (erroResumo || !resumo) return json({ error: 'Resumo não encontrado' }, 404);

    const material = [
      `Área: ${resumo.area}`,
      `Tema: ${resumo.tema}`,
      resumo.subtema ? `Subtema: ${resumo.subtema}` : '',
      '',
      resumo.markdown || '',
      resumo.exemplos ? `\n\nExemplos:\n${resumo.exemplos}` : '',
      resumo.termos ? `\n\nTermos:\n${resumo.termos}` : '',
    ].filter(Boolean).join('\n').slice(0, 24000);

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
    let conteudo: unknown;
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

    return json({ conteudo, cached: false });
  } catch (e) {
    console.error(e);
    return json({ error: 'Erro inesperado' }, 500);
  }
});
