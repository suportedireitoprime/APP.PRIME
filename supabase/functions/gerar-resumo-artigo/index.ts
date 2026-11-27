// Gera (e salva) o resumo "Conceitos" de um artigo de lei.
// O texto do artigo vem do app (base de leis fica em outro projeto Supabase),
// mas a tabela é validada contra a allowlist para evitar lixo no cache.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from 'npm:@supabase/supabase-js@2';
import { isTabelaLeiPermitida } from '../_shared/leis-tabelas.ts';
import { generateTextWithOmniRoute } from '../_shared/omnirouteText.ts';

const PROMPT = `Você é um professor de Direito brasileiro didático, empático e acolhedor. Com base no artigo de lei enviado, produza um RESUMO DE ESTUDO como se estivesse dando uma aula particular, pegando o aluno pela mão e explicando cada detalhe com bastante "jogo de cintura", para que ele entenda fácil e tenha vontade de continuar lendo.

Responda APENAS com JSON válido, sem blocos de código externos (não use \`\`\`json), no formato EXATO:
{
  "markdown": "A sua explicação do artigo. Desmembre bem o texto usando elementos de markdown (listas, tópicos, negrito para destacar partes importantes) para não ficar um bloco maçante. A explicação deve ser contínua e didática. No final, adicione obrigatoriamente um subtítulo '## Em português claro' com 2 ou 3 linhas resumindo a ideia central de forma ultra direta e simples.",
  "exemplos": "2 a 4 exemplos práticos de aplicação da lei. Formate como uma lista limpa, ex: '1. **Título do Exemplo:** Explicação...'. CUIDADO: NUNCA quebre a formatação do negrito em múltiplas linhas e evite usar '**' soltos.",
  "termos": "Glossário com 4 a 8 termos técnicos do artigo e seus significados. Formate como uma lista limpa, ex: '1. **Termo:** Significado...'. CUIDADO: NUNCA inicie uma linha com '**' perdido ou quebrado."
}
Português do Brasil. Cite o artigo no formato canônico. Não invente conteúdo que não decorra do artigo e da doutrina consolidada. Mantenha a formatação markdown impecável e sem erros de sintaxe.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
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

    const raw = await generateTextWithOmniRoute({
      systemPrompt: PROMPT,
      userPrompt: `Lei: ${leiNome}\nÁrea: ${area || 'Direito'}\nArtigo: ${numero}\n\n${texto}`,
      maxTokens: 4096,
      temperature: 0.55,
      jsonMode: true,
    });
    let parsed: { markdown?: string; exemplos?: string; termos?: string };
    try {
      parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
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
