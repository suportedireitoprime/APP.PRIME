// Gera metodologias de estudo (Cornell / Feynman) a partir de um resumo jurídico.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateTextWithOmniRoute } from '../_shared/omnirouteText.ts';

const PROMPTS: Record<string, string> = {
  conceitos: `Você é um jurista e professor titular de Direito brasileiro, com didática direta e envolvente. Com base no Tema, Subtema e no TEXTO BÁSICO fornecidos, produza um RESUMO JURÍDICO APROFUNDADO.
REGRAS CRÍTICAS:
- NUNCA inicie com saudações ("Olá", "Bem-vindo", etc.). Vá direto ao conteúdo.
- NUNCA deixe letras isoladas como "a" soltas em parágrafos. Revise a formatação final para garantir que o texto não tenha parágrafos truncados ou bugs de formatação.

ESTRUTURA OBRIGATÓRIA DO CAMPO "markdown":
1. # [Título Principal do Tema / Estudo Aprofundado]
2. Introdução e Contextualização: Origem histórica, fundamentação e por que isso importa na prática.
3. Desenvolvimento Analítico: Desmembre BEM o texto. Sempre que apresentar um conceito-chave, inclua IMEDIATAMENTE APÓS ELE um exemplo rápido de 1 a 2 linhas, integrado fluidamente no próprio texto, para tangibilizar a ideia na hora. Use listas, itálico e negrito para ficar leve e fácil de ler.
4. Alertas e Destaques Didáticos: Use blocos de citação para pegadinhas ou notas (> [!IMPORTANT], > [!NOTE], > [!WARNING]).
5. Jurisprudência Consolidada.
6. Quadro-Resumo Comparativo (tabela em markdown).
7. ## Em português claro: No final, adicione obrigatoriamente essa seção com 2 ou 3 linhas resumindo a ideia central da matéria de forma ultra direta e simples para o leigo.

CAMPOS ADICIONAIS:
- "exemplos": 3 a 5 casos práticos longos e estruturados. Formate como uma lista limpa (ex: '1. **Título do Exemplo:** Explicação...'). NUNCA quebre a formatação do negrito.
- "termos": Glossário com 5 a 10 termos técnicos. Formate como uma lista limpa. NUNCA inicie uma linha com '**' perdido.

Responda APENAS com JSON válido, sem blocos de código markdown ao redor (\`\`\`json), no formato EXATO:
{
  "markdown": "# ...\\n\\n...",
  "exemplos": "### Casos Práticos e Aplicação Forense\\n\\n...",
  "termos": "### Glossário de Termos Técnicos\\n\\n..."
}
Português do Brasil, rigor técnico mas escrita acessível, fluida e didática magistral.`,
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

    const raw = await generateTextWithOmniRoute({
      systemPrompt: PROMPTS[metodo],
      userPrompt: material,
      maxTokens: 8192,
      temperature: 0.5,
      jsonMode: true,
    });
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    let conteudo: any;
    try {
      conteudo = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
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
