import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { geminiFetch } from "../_shared/geminiFetch.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { aulaId } = body;

    if (!aulaId) {
      throw new Error("O parâmetro 'aulaId' é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca os dados da aula e seu módulo
    const { data: aula, error: aulaError } = await supabaseAdmin
      .from('aprender_aulas')
      .select(`
        id, titulo, objetivo, slug, modulo_id,
        aprender_modulos (titulo, aprender_areas(nome))
      `)
      .eq('id', aulaId)
      .single();

    if (aulaError || !aula) {
      throw new Error(`Aula não encontrada: ${aulaError?.message}`);
    }

    // 2. Busca se já existem blocos (para evitar duplicidade em requisições simultâneas)
    const { count } = await supabaseAdmin
      .from('aprender_blocos')
      .select('id', { count: 'exact', head: true })
      .eq('aula_id', aulaId);

    if (count && count > 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "A aula já possui blocos gerados.",
        total: count 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const moduloTitulo = (aula.aprender_modulos as any)?.titulo || 'Direito';
    const areaNome = (aula.aprender_modulos as any)?.aprender_areas?.nome || 'Direito';

    // 3. Constrói o Prompt pedagógico
    const prompt = `
Você é um professor titular e coordenador acadêmico em ${areaNome}.
Sua missão é gerar uma aula completa, aprofundada e interativa para estudantes e concurseiros no aplicativo móvel.

**TEMA DA AULA:** ${aula.titulo}
**MÓDULO:** ${moduloTitulo}
**OBJETIVO DIDÁTICO:** ${aula.objetivo || "Explicar os fundamentos teóricos, doutrinários, legais e práticos do tema de forma clara e abrangente."}

INSTRUÇÕES PEDAGÓGICAS CRÍTICAS:
- Gere de 10 a 16 blocos interativos, cobrindo introdução, desenvolvimento teórico profundo, exemplos práticos, fixação e síntese.
- Nos blocos de "leitura", escreva textos ricos e fluidos com explicações completas, doutrina relevante e dispositivos legais aplicáveis.
- Use títulos chamativos e objetivos.

SCHEMAS DE BLOCOS PERMITIDOS:
1. Capa:
{"tipo": "destaque", "payload": {"subtipo": "capa", "titulo": "${aula.titulo}", "texto": "Introdução cativante sobre a importância deste tema no ordenamento jurídico e na prática.", "sumario": ["Fundamentos e Origem", "Regras e Doutrina", "Casos e Fixação"]}}

2. Leitura (Texto aprofundado com markdown):
{"tipo": "leitura", "payload": {"texto": "### Fundamentos Teóricos\\n\\nExplicação rica e bem fundamentada em vários parágrafos..."}}

3. Destaque (Conceito Chave ou Súmula):
{"tipo": "destaque", "payload": {"titulo": "Ponto de Atenção", "texto": "Regra fundamental ou distinção indispensável sobre o tema."}}

4. Linha do Tempo:
{"tipo": "leitura", "payload": {"subtipo": "linha_tempo", "titulo": "Evolução Histórica", "texto": "Marcos determinantes na construção deste instituto", "eventos": [{"marco": "Origem", "titulo": "Fase Inicial", "descricao": "Primeiras formulações..."}, {"marco": "Evolução", "titulo": "Consolidação", "descricao": "Entendimento moderno..."}]}}

5. Tabela Comparativa:
{"tipo": "tabela", "payload": {"titulo": "Diferenças Essenciais", "colunas": ["Critério", "Visão Clássica / Tradicional", "Abordagem Contemporânea"], "linhas": [["Finalidade", "Prevenção geral", "Garantismo e intervenção mínima"], ["Foco", "O Delito", "A Vítima e Sociedade"]]}}

6. Flashcard:
{"tipo": "flashcard", "payload": {"frente": "Qual a principal definição ou regra aplicável a ${aula.titulo}?", "verso": "Explicação completa e detalhada da resposta."}}

7. Pergunta (Múltipla Escolha):
{"tipo": "pergunta", "resposta_correta": "b", "payload": {"titulo": "Questão de Fixação", "enunciado": "Em relação a ${aula.titulo}, analise a situação hipotética e assinale a afirmativa correta:", "opcoes": ["A) Primeira alternativa incorreta com justificativa falsa.", "B) Alternativa juridicamente correta conforme a doutrina e jurisprudência.", "C) Segunda alternativa incorreta.", "D) Terceira alternativa incorreta."], "justificativa": "A letra B é a correta porque reflete a jurisprudência dominante e os princípios fundamentais."}}

8. Conexão de Grupos:
{"tipo": "conexao", "payload": {"pares": [{"termo": "Conceito Central", "definicao": "Definição precisa do instituto"}, {"termo": "Princípio Regente", "definicao": "Diretriz orientadora"}, {"termo": "Finalidade Prática", "definicao": "Objetivo de aplicação no caso concreto"}]}}

9. Recapitulação (Método Cornell) - ÚLTIMO BLOCO:
{"tipo": "leitura", "payload": {"subtipo": "recapitulacao", "titulo": "Recapitulação e Síntese", "pontos": ["Definição essencial dominada com sucesso.", "Distinção entre as correntes compreendida.", "Impacto jurisprudencial consolidado."], "regra_de_ouro": "Regra de ouro síntese para memorizar e gabaritar provas."}}

Retorne ESTRITAMENTE o JSON puro no formato:
{
  "blocos": [ { ... } ]
}
`.trim();

    let blocosFinais: any[] = [];
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY_RESERVA') || '';

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
                temperature: 0.5,
                maxOutputTokens: 8192,
              }
            })
          });

          if (res.ok) {
            const dataJson = await res.json();
            const textResponse = dataJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleanJson = textResponse.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed?.blocos && Array.isArray(parsed.blocos) && parsed.blocos.length > 0) {
              blocosFinais = parsed.blocos;
              break;
            }
          }
        } catch (aiErr) {
          console.warn(`[aprender-aula-gerar] Falha ao tentar modelo ${model}:`, aiErr);
        }
      }
    }

    // 4. Fallback Pedagógico Automático: se a IA estiver temporariamente sem cota, constrói a aula estruturada
    if (blocosFinais.length === 0) {
      const t = aula.titulo;
      blocosFinais = [
        {
          tipo: "destaque",
          payload: {
            subtipo: "capa",
            titulo: t,
            texto: `Bem-vindo a esta aula sobre ${t}. Aqui você dominará os conceitos estruturantes, o histórico evolutivo, a legislação aplicável e a jurisprudência dominante com exercícios de fixação imediata.`,
            sumario: ["Conceitos e Fundamentos", "Doutrina e Análise Prática", "Fixação Ativa e Questões"]
          }
        },
        {
          tipo: "leitura",
          payload: {
            texto: `### 1. Panorama Geral e Fundamentos de ${t}\n\nO estudo de **${t}** ocupa papel de destaque no ramo de **${moduloTitulo}**. Sua compreensão exige a identificação do bem jurídico tutelado, as origens normativas e os princípios constitucionais que balizam sua incidência.\n\nHistoricamente, a doutrina tradicional dedicou especial atenção às premissas basilares que diferenciam este instituto de figuras afins no direito comparado, assegurando coerência sistemática e segurança jurídica.`
          }
        },
        {
          tipo: "destaque",
          payload: {
            titulo: "Regra Fundamental",
            texto: `Em ${t}, a diretriz predominante impõe interpretação sistemática e teleológica, em consonância com as garantias fundamentais e a jurisprudência pacificada dos Tribunais Superiores.`
          }
        },
        {
          tipo: "leitura",
          payload: {
            texto: `### 2. Aprofundamento Doutrinário e Aplicação Prática\n\nNa prática forense e nos certames públicos, **${t}** costuma ser exigido a partir de suas nuances e hipóteses de incidência prática. É fundamental atentar-se aos elementos objetivos e subjetivos que caracterizam a matéria.\n\nOs principais doutrinadores convergem quanto à necessidade de observar os critérios de proporcionalidade e razoabilidade na exegese das normas pertinentes.`
          }
        },
        {
          tipo: "leitura",
          payload: {
            subtipo: "linha_tempo",
            titulo: "Evolução e Linha do Tempo",
            texto: "Marcos fundamentais no desenvolvimento da matéria",
            eventos: [
              { marco: "Marco 1", titulo: "Concepção Clássica", descricao: "Primeiros delineamentos e delimitação do conceito no ordenamento." },
              { marco: "Marco 2", titulo: "Reforma Normativa", descricao: "Modernização legislativa e incorporação de novas diretrizes hermenêuticas." },
              { marco: "Marco 3", titulo: "Jurisprudência Atual", descricao: "Prevalência dos entendimentos firmados nas cortes superiores." }
            ]
          }
        },
        {
          tipo: "tabela",
          payload: {
            titulo: "Quadro Comparativo e Distinções Relevantes",
            colunas: ["Elemento", "Regra Geral", "Exceção / Ponto de Atenção"],
            linhas: [
              ["Conceito Central", "Aplicação ampla conforme previsão expressa", "Restrições em casos de expressa vedação"],
              ["Finalidade", "Tutela do interesse público e da ordem jurídica", "Ponderação diante de direitos fundamentais"],
              ["Critério Decisório", "Previsão legal estrita", "Hermenêutica principiológica integrativa"]
            ]
          }
        },
        {
          tipo: "flashcard",
          payload: {
            frente: `Qual é o núcleo conceitual de ${t}?`,
            verso: `O núcleo conceitual de ${t} reside na aplicação coordenada de suas regras e princípios no contexto de ${moduloTitulo}, assegurando o alcance de suas finalidades institucionais com observância irrestrita aos precedentes judiciais.`
          }
        },
        {
          tipo: "conexao",
          payload: {
            pares: [
              { termo: "Instituto Principal", definicao: `Tema central objeto de estudo: ${t}` },
              { termo: "Subsunção Legal", definicao: "Enquadramento do fato concreto à previsão normativa abstrata" },
              { termo: "Segurança Jurídica", definicao: "Previsibilidade e estabilidade na aplicação das decisões" }
            ]
          }
        },
        {
          tipo: "pergunta",
          resposta_correta: "b",
          payload: {
            titulo: "Questão Prática de Fixação",
            enunciado: `A respeito de ${t}, assinale a alternativa juridicamente adequada:`,
            opcoes: [
              "A) A matéria prescinde de fundamentação expressa, podendo decorrer de interpretação analógica desfavorável.",
              "B) A aplicação deve observar a coerência sistemática do ordenamento, alinhando-se aos princípios e precedentes vinculantes.",
              "C) O instituto encontra-se revogado tacitamente e não mais produz efeitos práticos.",
              "D) Não há divergência doutrinária ou balizas normativas a serem observadas."
            ],
            justificativa: "A alternativa B está correta. A correta incidência de institutos jurídicos requer conformidade com a ordem constitucional, legalidade estrita e precedentes consolidados."
          }
        },
        {
          tipo: "destaque",
          payload: {
            titulo: "Jurisprudência & Precedentes",
            texto: `A jurisprudência dos Tribunais Superiores enfatiza a necessidade de observância aos parâmetros de razoabilidade e proporcionalidade ao examinar controvérsias atinentes a ${t}.`
          }
        },
        {
          tipo: "flashcard",
          payload: {
            frente: `Como os concursos públicos e exames da OAB costumam abordar ${t}?`,
            verso: `Costumam exigir a distinção entre a regra geral e as exceções legais, além do conhecimento de teses fixadas em recursos repetitivos e súmulas de repercussão geral.`
          }
        },
        {
          tipo: "leitura",
          payload: {
            subtipo: "recapitulacao",
            titulo: "Recapitulação pelo Método Cornell",
            pontos: [
              `Fundamentos de ${t} dominados com clareza conceitual.`,
              "Diferenciações práticas e tabela comparativa assimiladas.",
              "Fixação ativa por flashcards e questões realizada com êxito."
            ],
            regra_de_ouro: `Dominar ${t} significa articular a teoria com a jurisprudência aplicada no cotidiano jurídico.`
          }
        }
      ];
    }

    // 5. Mapeia e insere os blocos
    const blocosParaInserir = blocosFinais.map((bloco: any, index: number) => ({
      aula_id: aulaId,
      ordem: index + 1,
      tipo: bloco.tipo,
      payload: bloco.payload,
      resposta_correta: bloco.resposta_correta || null
    }));

    const { error: insertError } = await supabaseAdmin
      .from('aprender_blocos')
      .insert(blocosParaInserir);

    if (insertError) {
      throw insertError;
    }

    // 6. Garante status = 'published' na aula
    await supabaseAdmin
      .from('aprender_aulas')
      .update({ status: 'published' })
      .eq('id', aulaId);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Foram gerados e inseridos ${blocosParaInserir.length} blocos com sucesso.`,
      total: blocosParaInserir.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Erro em aprender-aula-gerar:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
