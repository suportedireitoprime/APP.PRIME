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
    const { aulaId } = await req.json();

    if (!aulaId) {
      throw new Error("O parâmetro 'aulaId' é obrigatório.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Busca os dados da aula
    const { data: aula, error: aulaError } = await supabaseAdmin
      .from('aprender_aulas')
      .select('titulo, objetivo, slug')
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
      return new Response(JSON.stringify({ message: "A aula já possui blocos gerados." }), {
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

    // 4. Constrói o Prompt (adaptado para textos mais explicativos e longos)
    const prompt = `
Você é um professor acadêmico de alto nível, especialista em Direito e Didática.
Sua missão é gerar os blocos interativos para uma aula no aplicativo móvel.

**TEMA DA AULA:** ${aula.titulo}
**OBJETIVO DA AULA:** ${aula.objetivo || "Ensinar o tema de forma profunda, detalhada e altamente explicativa, com exemplos reais e foco prático."}

**INSTRUÇÕES CRÍTICAS SOBRE O TEXTO:**
- Não faça resumos superficiais ou textos quebrados. Queremos textos LONGOS, CORRIDOS E MUITO BEM EXPLICATIVOS, como uma verdadeira aula de faculdade premium.
- Mergulhe nos conceitos, traga contexto histórico se relevante, explique as razões de ser das leis, não apenas as jogue na tela.
- Use parágrafos fluidos, mantendo a leitura agradável e densa de conhecimento.
- Em blocos de "leitura", sinta-se livre para escrever pelo menos 2 a 3 parágrafos bem desenvolvidos.

**INSTRUÇÕES SOBRE OS BLOCOS (Mínimo de 15 a 20 blocos):**
Você deve retornar ESTRITAMENTE um objeto JSON com a propriedade "blocos", contendo um array de objetos.
NÃO USE MARCAÇÃO DE MARKDOWN (\`\`\`json) NA RESPOSTA INTEIRA, retorne APENAS o JSON puro e válido.

Cada bloco deve seguir OBRIGATORIAMENTE um dos schemas abaixo. Você DEVE misturá-los para criar uma jornada pedagógica rica.

A ORDEM OBRIGATÓRIA DA AULA:
1. Sempre comece com o BLOCO DE CAPA.
2. Intercale teoria rica (leitura, destaque) com fixação (pergunta, flashcard).
3. Sempre inclua pelo menos 1 Linha do Tempo e 1 Conexão de Grupos.
4. Termine SEMPRE com o Bloco de Recapitulação (Método Cornell).

SCHEMAS PERMITIDOS PARA O ARRAY DE BLOCOS:

1. Capa (Boas-vindas):
{"tipo": "destaque", "payload": {"subtipo": "capa", "titulo": "TÍTULO DA AULA", "texto": "Parágrafo introdutório convidativo e empolgante", "sumario": ["Tópico 1", "Tópico 2"]}}

2. Leitura (Texto longo e explicativo, use Markdown para negrito):
{"tipo": "leitura", "payload": {"texto": "### Título\\n\\nParágrafos longos, detalhados e bem explicados..."}}

3. Destaque (Atenção, Regra Geral, Exceção, Jurisprudência, Cuidado - será estilizado no app com SVGs visuais):
{"tipo": "destaque", "payload": {"titulo": "Um título chamativo (ex: A Regra de Ouro, Cuidado com a Pegadinha, Visão do STF)", "texto": "Explicação incisiva..."}}

4. Linha do Tempo Animada:
{"tipo": "leitura", "payload": {"subtipo": "linha_tempo", "titulo": "Evolução do tema", "texto": "Acompanhe", "eventos": [{"marco": "Ano/Passo 1", "titulo": "O início", "descricao": "Detalhes"}, {"marco": "Ano/Passo 2", "titulo": "A mudança", "descricao": "Detalhes"}]}}

5. Conexão de Grupos (Match/Ligação de conceitos):
{"tipo": "conexao", "payload": {"pares": [{"termo": "Termo Curto", "definicao": "Definição Clara"}, {"termo": "Termo Curto", "definicao": "Definição Clara"}]}}

6. Mapa Conceitual (Grafo de 3 ou 4 nós curtos):
{"tipo": "leitura", "payload": {"subtipo": "mapa_conceitual", "titulo": "Visão Sistêmica", "nos": [{"id": "a", "rotulo": "Conceito Central"}, {"id": "b", "rotulo": "Ramo 1"}, {"id": "c", "rotulo": "Ramo 2"}], "arestas": [{"de": "a", "para": "b", "relacao": "gera"}, {"de": "a", "para": "c", "relacao": "protege"}]}}

7. Tabela Comparativa:
{"tipo": "tabela", "payload": {"titulo": "Diferenças Principais", "colunas": ["Tópico", "Lado A", "Lado B"], "linhas": [["Regra", "X", "Y"]]}}

8. Flashcard (Verso deve ser detalhado e explicativo):
{"tipo": "flashcard", "payload": {"frente": "Uma pergunta direta", "verso": "A resposta detalhada, explicando o porquê."}}

9. Pergunta (Múltipla Escolha):
{"tipo": "pergunta", "resposta_correta": "c", "payload": {"titulo": "Fixação", "enunciado": "A historinha do caso...", "opcoes": ["A...", "B...", "C...", "D..."], "justificativa": "Letra C. Explicação detalhada e longa de por que esta é a correta."}}

10. Recapitulação (MÉTODO CORNELL) - ÚLTIMO BLOCO OBRIGATÓRIO:
{"tipo": "leitura", "payload": {"subtipo": "recapitulacao", "titulo": "O que fica desta aula", "pontos": ["Palavra Chave 1: Anotação ou definição super detalhada.", "Palavra Chave 2: Anotação super detalhada."], "regra_de_ouro": "Um sumário executivo em uma frase forte."}}

LEMBRE-SE: Retorne APENAS o JSON no formato:
{ "blocos": [ { ... }, { ... } ] }
Não inclua \`\`\`json no início nem no final. Garanta que o JSON é parseável por JSON.parse().
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResult = response.text();
    
    // Limpeza de markdown caso a IA desobedeça
    textResult = textResult.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    
    let generatedData;
    try {
      generatedData = JSON.parse(textResult);
    } catch (e) {
      console.error("Falha ao fazer parse do JSON retornado pelo Gemini:", textResult.substring(0, 500));
      throw new Error("Erro de formatação na resposta da IA.");
    }

    if (!generatedData.blocos || !Array.isArray(generatedData.blocos)) {
      throw new Error("O JSON retornado não contém o array 'blocos'.");
    }

    // 5. Mapeia e insere os blocos
    const blocosParaInserir = generatedData.blocos.map((bloco: any, index: number) => ({
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

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Foram gerados e inseridos ${blocosParaInserir.length} blocos com sucesso.` 
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
