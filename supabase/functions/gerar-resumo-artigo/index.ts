// Gera (e salva) o resumo "Conceitos" de um artigo de lei.
// O texto do artigo vem do app (base de leis fica em outro projeto Supabase),
// mas a tabela é validada contra a allowlist para evitar lixo no cache.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { isTabelaLeiPermitida } from '../_shared/leis-tabelas.ts';

const GATEWAY_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const MODEL = 'gemini-3.6-flash';

const PROMPT = `Você é um professor de Direito brasileiro. Com base no artigo de lei enviado, produza um RESUMO DE ESTUDO.
Responda APENAS com JSON válido, sem markdown externo, no formato:
{
  "markdown": "resumo em markdown com títulos (##), tópicos e destaque dos pontos essenciais",
  "exemplos": "2 a 4 exemplos práticos em markdown (lista)",
  "termos": "glossário em markdown com 4 a 8 termos técnicos do artigo e seus significados"
}
Português do Brasil, linguagem técnica e clara. Cite o artigo no formato canônico. Não invente conteúdo que não decorra do artigo e da doutrina consolidada.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return json({ error: 'LOVABLE_API_KEY ausente' }, 500);

    const body = await req.json().catch(() => ({}));
    const tabela = body?.tabela_codigo;
    const numero = typeof body?.numero_artigo === 'string' ? body.numero_artigo.trim() : '';
    const area = typeof body?.area === 'string' ? body.area.trim() : '';
    const leiNome = typeof body?.lei_nome === 'string' ? body.lei_nome.trim() : '';
    const texto = typeof body?.texto === 'string' ? body.texto.trim().slice(0, 12000) : '';

    if (!isTabelaLeiPermitida(tabela)) return json({ error: 'Tabela de lei inválida' }, 400);
    if (!numero || !leiNome) return json({ error: 'numero_artigo e lei_nome são obrigatórios' }, 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: existente } = await supabase
      .from('resumos_juridicos')
      .select('id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos')
      .eq('tabela_codigo', tabela)
      .eq('numero_artigo', numero)
      .maybeSingle();
    if (existente?.markdown) return json({ resumo: existente, cached: true });

    if (!texto) return json({ error: 'Texto do artigo não enviado' }, 400);

    const resp = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: PROMPT },
          {
            role: 'user',
            content: `Lei: ${leiNome}\nÁrea: ${area || 'Direito'}\nArtigo: ${numero}\n\n${texto}`,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      const detalhe = await resp.text();
      console.error('Gateway falhou', resp.status, detalhe);
      if (resp.status === 429) return json({ error: 'Muitas gerações agora. Tente em instantes.' }, 429);
      if (resp.status === 402) return json({ error: 'Créditos de IA esgotados.' }, 402);
      return json({ error: 'Falha ao gerar resumo', detalhe }, resp.status);
    }

    const payload = await resp.json();
    const raw: string = payload?.choices?.[0]?.message?.content ?? '';
    let parsed: { markdown?: string; exemplos?: string; termos?: string };
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*|```$/g, '').trim());
    } catch {
      parsed = { markdown: raw };
    }
    if (!parsed?.markdown) return json({ error: 'Resposta da IA inválida' }, 502);

    const linha = {
      area: area || leiNome,
      tema: leiNome,
      subtema: numero,
      tabela_codigo: tabela,
      numero_artigo: numero,
      markdown: parsed.markdown,
      exemplos: parsed.exemplos ?? null,
      termos: parsed.termos ?? null,
    };

    const { data: salvo, error: erroSalvar } = await supabase
      .from('resumos_juridicos')
      .insert(linha)
      .select('id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos')
      .single();

    if (erroSalvar || !salvo) {
      console.error('Erro ao salvar resumo', erroSalvar);
      // Corrida: outra requisição pode ter salvo o mesmo artigo primeiro.
      const { data: recuperado } = await supabase
        .from('resumos_juridicos')
        .select('id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos')
        .eq('tabela_codigo', tabela)
        .eq('numero_artigo', numero)
        .maybeSingle();
      if (recuperado) return json({ resumo: recuperado, cached: true });
      return json({ error: 'Não foi possível salvar o resumo' }, 500);
    }

    return json({ resumo: salvo, cached: false });
  } catch (e) {
    console.error('gerar-resumo-artigo erro', e);
    return json({ error: (e as Error).message || 'Erro inesperado' }, 500);
  }
});
