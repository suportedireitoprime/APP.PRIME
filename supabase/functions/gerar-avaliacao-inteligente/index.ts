import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { area } = await req.json()

    if (!area) {
      throw new Error('Área não informada.')
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('API Key do Gemini não configurada.')
    }

    console.log(`Gerando questão para a área: ${area}`)

    const prompt = `Você é um professor acadêmico de Direito.
O usuário está fazendo uma avaliação de conhecimento na área de "${area}".
Sua tarefa é gerar uma questão de múltipla escolha focada no concurso público ou exame da OAB para esta área.

OBRIGATÓRIO responder APENAS com um objeto JSON válido (sem markdown de bloco de código) com o seguinte formato exato:
{
  "enunciado": "Texto da questão completa e bem elaborada.",
  "alternativas": ["Opção A", "Opção B", "Opção C", "Opção D"],
  "indiceCorreto": 2, // (Número inteiro de 0 a 3, indicando a resposta certa no array acima)
  "justificativa": "Explicação detalhada do porquê a resposta correta é a correta, com base na legislação ou doutrina."
}

NÃO adicione nenhuma palavra além do JSON.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    })

    const geminiData = await response.json()
    console.log('Resposta bruta do Gemini:', JSON.stringify(geminiData))

    if (!response.ok) {
      throw new Error(`Erro na API do Gemini: ${geminiData.error?.message || 'Desconhecido'}`)
    }

    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('O Gemini não retornou nenhum texto.')
    }

    let respostaTexto = geminiData.candidates[0].content.parts[0].text.trim()
    
    // Limpar markdown de bloco de código JSON, se existir
    if (respostaTexto.startsWith('```json')) {
      respostaTexto = respostaTexto.replace(/```json/g, '').replace(/```/g, '').trim()
    } else if (respostaTexto.startsWith('```')) {
      respostaTexto = respostaTexto.replace(/```/g, '').trim()
    }

    const questaoJson = JSON.parse(respostaTexto)

    return new Response(JSON.stringify(questaoJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
