import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestData {
  dataInicio?: string
  dataFim?: string
}

serve(async (req) => {
  // Tratamento de CORS (preflight request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dataInicio, dataFim } = await req.json() as RequestData

    // Validação básica da data, usa a data atual se não fornecida
    const today = new Date().toISOString().split('T')[0]
    const start = dataInicio || today
    const end = dataFim || today

    const url = `https://dadosabertos.camara.leg.br/api/v2/eventos?dataInicio=${start}&dataFim=${end}&ordem=ASC&ordenarPor=dataHoraInicio`

    console.log(`Buscando eventos da Câmara: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro na API da Câmara: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Opcional: Mapear para um formato mais amigável para o frontend
    const eventosFormatados = data.dados.map((evento: any) => ({
      id: evento.id,
      titulo: evento.descricaoTipo || 'Sessão/Evento',
      descricao: evento.descricao,
      horaInicio: evento.dataHoraInicio,
      horaFim: evento.dataHoraFim,
      local: evento.localCamara?.nome || evento.localExterno || 'Não especificado',
      orgaos: evento.orgaos?.map((o: any) => o.sigla).join(', ') || '',
      fases: evento.fases || '',
      situacao: evento.situacao,
      uri: evento.uri
    }))

    return new Response(
      JSON.stringify({ eventos: eventosFormatados }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Erro no processamento da agenda da câmara:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})
