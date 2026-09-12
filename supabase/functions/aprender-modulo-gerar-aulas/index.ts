import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { moduloId } = await req.json();

    if (!moduloId) {
      throw new Error("O parâmetro 'moduloId' é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca os dados do módulo e da área
    const { data: modulo, error: moduloError } = await supabaseAdmin
      .from('aprender_modulos')
      .select(`
        id, titulo, resumo, 
        aprender_areas (nome)
      `)
      .eq('id', moduloId)
      .single();

    if (moduloError || !modulo) {
      throw new Error(`Módulo não encontrado: ${moduloError?.message}`);
    }

    // 2. Verifica se o módulo já tem aulas para evitar re-geração acidental
    const { count } = await supabaseAdmin
      .from('aprender_aulas')
      .select('id', { count: 'exact', head: true })
      .eq('modulo_id', moduloId);

    if (count && count > 0) {
      return new Response(JSON.stringify({ message: "O módulo já possui aulas cadastradas." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Inicializa o Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY não configurada.");
    }
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    // Tratar areaNome, já que pode vir como objeto ou array dependendo da relation
    let areaNome = 'Conhecimento Geral';
    if (modulo.aprender_areas) {
      if (Array.isArray(modulo.aprender_areas)) {
        areaNome = modulo.aprender_areas[0]?.nome || areaNome;
      } else {
        areaNome = modulo.aprender_areas.nome || areaNome;
      }
    }

    // 4. Busca Tópicos (Aulas) Baseados na Tabela Oficial 'resumos_juridicos'
    const { data: resumosOficiais } = await supabaseAdmin
      .from('resumos_juridicos')
      .select('subtema, ordem_subtema')
      .ilike('tema', modulo.titulo)
      .order('ordem_subtema', { ascending: true });

    const topicosSugeridos = resumosOficiais && resumosOficiais.length > 0
      ? resumosOficiais.map(r => r.subtema).filter(Boolean)
      : null;

    let instrucoesAdicionais = `Crie de 5 a 10 aulas que cubram este módulo do início ao fim, partindo dos conceitos básicos até os mais avançados.`;
    
    if (topicosSugeridos && topicosSugeridos.length > 0) {
      instrucoesAdicionais = `
ATENÇÃO: Você DEVE usar ESTRITAMENTE a seguinte lista de tópicos oficiais como base para criar as aulas, mantendo a exata ordem:
${topicosSugeridos.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Cada tópico acima deve se tornar uma aula na sua resposta. Não invente tópicos fora dessa lista. Apenas transforme cada um em um título de aula atrativo e gere o objetivo didático para ele.`;
    }

    // 5. Constrói o Prompt para a Ementa (Plano de Aulas)
    const prompt = `
Você é um Coordenador Pedagógico e Especialista Acadêmico em ${areaNome}.
Sua missão é criar o roteiro ideal de aulas (Plano de Estudos) para o seguinte módulo:

**ÁREA DE CONHECIMENTO:** ${areaNome}
**TEMA DO MÓDULO:** ${modulo.titulo}
**RESUMO DO MÓDULO:** ${modulo.resumo || "Fornecer uma base sólida e aprofundada sobre o tema."}

**INSTRUÇÕES:**
${instrucoesAdicionais}

Para cada aula, forneça um título instigante e claro, e um objetivo didático (o que o aluno vai aprender).
As aulas devem ser ordenadas logicamente.

Você deve retornar ESTRITAMENTE um objeto JSON no seguinte formato, sem formatação Markdown (\`\`\`json), apenas o JSON puro e válido:
{
  "aulas": [
    {
      "titulo": "Título da Aula",
      "objetivo": "Objetivo didático e descrição curta do que será ensinado."
    }
  ]
}
`;

    // 5. Chama a API do Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 6. Extrai e valida o JSON
    const jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    if (!data.aulas || !Array.isArray(data.aulas) || data.aulas.length === 0) {
      throw new Error("O formato retornado pela IA não contém a propriedade 'aulas' com elementos.");
    }

    // Helper para gerar slug a partir do título
    const toSlug = (text: string) => text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    // 7. Salva as aulas no banco (status = 'draft' por padrão da tabela)
    const aulasToInsert = data.aulas.map((aula: any, index: number) => ({
      modulo_id: moduloId,
      titulo: aula.titulo,
      slug: toSlug(aula.titulo),
      objetivo: aula.objetivo,
      ordem: index + 1,
      duracao_est_min: 15,
      previa: true,
      modelo_ia: 'gemini-3.6-flash',
      gerada_em: new Date().toISOString()
    }));

    const { error: insertError } = await supabaseAdmin
      .from('aprender_aulas')
      .insert(aulasToInsert);

    if (insertError) {
      throw new Error(`Falha ao inserir as aulas geradas: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${aulasToInsert.length} aulas geradas com sucesso!` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Erro na Edge Function aprender-modulo-gerar-aulas:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
