import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { geminiFetch } from "../_shared/geminiFetch.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper para gerar slug a partir do título
const toSlug = (text: string) => text
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .substring(0, 80);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { moduloId } = body;

    if (!moduloId) {
      throw new Error("O parâmetro 'moduloId' é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca os dados do módulo (aceita UUID ou slug)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduloId);
    let moduloQuery = supabaseAdmin
      .from('aprender_modulos')
      .select('id, titulo, resumo, aprender_areas (nome)');

    if (isUuid) {
      moduloQuery = moduloQuery.eq('id', moduloId);
    } else {
      moduloQuery = moduloQuery.eq('slug', moduloId);
    }

    const { data: modulo, error: moduloError } = await moduloQuery.maybeSingle();

    if (moduloError || !modulo) {
      throw new Error(`Módulo não encontrado: ${moduloError?.message || 'Identificador inexistente'}`);
    }

    const realModuloId = modulo.id;

    // 2. Verifica se o módulo já tem aulas para evitar re-geração acidental
    const { count } = await supabaseAdmin
      .from('aprender_aulas')
      .select('id', { count: 'exact', head: true })
      .eq('modulo_id', realModuloId);

    if (count && count > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "O módulo já possui aulas cadastradas.",
        total: count
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Tratar areaNome
    let areaNome = 'Direito';
    if (modulo.aprender_areas) {
      if (Array.isArray(modulo.aprender_areas)) {
        areaNome = modulo.aprender_areas[0]?.nome || areaNome;
      } else {
        areaNome = (modulo.aprender_areas as any).nome || areaNome;
      }
    }

    // 3. Busca Tópicos (Aulas) Baseados na Tabela Oficial 'resumos_juridicos'
    const { data: resumosOficiais } = await supabaseAdmin
      .from('resumos_juridicos')
      .select('subtema, ordem_subtema')
      .ilike('tema', modulo.titulo)
      .order('ordem_subtema', { ascending: true });

    const topicosSugeridos = resumosOficiais && resumosOficiais.length > 0
      ? resumosOficiais.map(r => r.subtema).filter(Boolean)
      : null;

    let aulasFinais: Array<{ titulo: string; objetivo: string }> = [];

    // 4. Tenta gerar via Gemini com geminiFetch e rotação de chaves
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY_RESERVA') || '';

    let instrucoesAdicionais = `Crie de 6 a 10 aulas didáticas que cubram este módulo do início ao fim, partindo dos fundamentos conceituais até aplicações e jurisprudência.`;
    if (topicosSugeridos && topicosSugeridos.length > 0) {
      instrucoesAdicionais = `
ATENÇÃO: Você DEVE usar ESTRITAMENTE a seguinte lista de tópicos oficiais como base para criar as aulas, mantendo a exata ordem:
${topicosSugeridos.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Cada tópico acima deve se tornar uma aula na sua resposta. Transforme cada um em um título de aula claro e didático e gere um objetivo de aprendizado objetivo para ela.`;
    }

    const prompt = `
Você é um Coordenador Pedagógico e Especialista Acadêmico em ${areaNome}.
Sua missão é criar o roteiro de aulas (Plano de Estudos / Ementa) para o seguinte módulo:

ÁREA: ${areaNome}
TEMA DO MÓDULO: ${modulo.titulo}
RESUMO: ${modulo.resumo || "Formação aprofundada com teoria, prática e jurisprudência."}

INSTRUÇÕES:
${instrucoesAdicionais}

Retorne ESTRITAMENTE um objeto JSON no formato abaixo, sem markdown, sem delimitadores triplos:
{
  "aulas": [
    {
      "titulo": "Título da Aula",
      "objetivo": "Objetivo didático e descrição curta do que será ensinado."
    }
  ]
}
`.trim();

    if (apiKey) {
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash"];
      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const res = await geminiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 4096,
              }
            })
          });

          if (res.ok) {
            const dataJson = await res.json();
            const textResponse = dataJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleanJson = textResponse.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed?.aulas && Array.isArray(parsed.aulas) && parsed.aulas.length > 0) {
              aulasFinais = parsed.aulas;
              break;
            }
          }
        } catch (aiErr) {
          console.warn(`[aprender-modulo-gerar-aulas] Falha ao tentar modelo ${model}:`, aiErr);
        }
      }
    }

    // 5. Fallback Seguro: Se a IA não respondeu ou estourou cota, usamos os tópicos oficiais de resumos_juridicos ou currículo estruturado
    if (aulasFinais.length === 0) {
      if (topicosSugeridos && topicosSugeridos.length > 0) {
        aulasFinais = topicosSugeridos.map((topico, idx) => ({
          titulo: topico,
          objetivo: `Compreender a fundo os conceitos, doutrina e aplicação prática de ${topico}.`
        }));
      } else {
        const t = modulo.titulo;
        aulasFinais = [
          { titulo: `Fundamentos e Conceitos de ${t}`, objetivo: `Introdução conceitual, histórico e terminologia essencial de ${t}.` },
          { titulo: `Teoria Geral e Princípios Aplicáveis a ${t}`, objetivo: `Análise dos princípios norteadores e balizas constitucionais.` },
          { titulo: `Estrutura Jurídica e Disposições Legais em ${t}`, objetivo: `Estudo analítico dos artigos legais e regras normativas.` },
          { titulo: `Aspectos Práticos e Casos Concretos de ${t}`, objetivo: `Aplicação prática e resolução de controvérsias contemporâneas.` },
          { titulo: `Jurisprudência Relevante e Súmulas: ${t}`, objetivo: `Julgados paradigmas dos Tribunais Superiores (STF e STJ).` },
          { titulo: `Fixação e Tendências Modernas em ${t}`, objetivo: `Revisão consolidada, pontos de atenção para concursos e evolução dogmática.` }
        ];
      }
    }

    // 6. Insere as aulas no banco com status = 'published'
    const aulasToInsert = aulasFinais.map((aula, index) => ({
      modulo_id: realModuloId,
      titulo: aula.titulo,
      slug: toSlug(aula.titulo) || `aula-${index + 1}`,
      objetivo: aula.objetivo,
      ordem: index + 1,
      duracao_est_min: 15,
      status: 'published',
      previa: true,
      modelo_ia: 'gemini-3.1-flash-lite',
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
      message: `${aulasToInsert.length} aulas geradas com sucesso!`,
      total: aulasToInsert.length,
      aulas: aulasToInsert
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
