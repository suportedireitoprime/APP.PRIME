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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dataInicio, dataFim } = await req.json() as RequestData

    const today = new Date().toISOString().split('T')[0]
    const start = (dataInicio || today).replace(/-/g, '')
    const end = (dataFim || today).replace(/-/g, '')

    const url = `https://legis.senado.leg.br/dadosabertos/comissao/agenda/${start}/${end}`
    console.log(`Buscando eventos do Senado: ${url}`)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro na API do Senado: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const reunioesRaw = data?.AgendaReuniao?.reunioes?.reuniao || []
    const reunioes = Array.isArray(reunioesRaw) ? reunioesRaw : [reunioesRaw]

    const eventosFormatados = reunioes.map((evento: any) => {
      const dataStr = evento.data
      const horaStr = evento.hora
      const horaInicio = dataStr && horaStr ? `${dataStr}T${horaStr}` : ''
      const horaFim = evento.dataHoraFim || ''

      const titulo = [evento.tipo, evento.descricaoSessao, evento.finalidade].filter(Boolean).join(' ')

      const orgaosRaw = evento.colegiados?.colegiado
      const orgaosArray = Array.isArray(orgaosRaw) ? orgaosRaw : [orgaosRaw].filter(Boolean)
      const orgaosStr = orgaosArray.map((o: any) => o.nome || o.sigla).join(', ')

      const videosRaw = evento.videos?.video || evento.videos
      let urlRegistro = ''
      if (Array.isArray(videosRaw)) {
         urlRegistro = videosRaw[0]?.url || ''
      } else if (videosRaw?.url) {
         urlRegistro = videosRaw.url
      }

      const materiasRaw = evento.materias?.materia
      const materiasArray = Array.isArray(materiasRaw) ? materiasRaw : [materiasRaw].filter(Boolean)
      const pauta = materiasArray.map((m: any) => m.descricao).join('\n\n')

      return {
        id: evento.codigo,
        titulo: titulo || 'Sessão do Senado',
        descricao: pauta,
        horaInicio,
        horaFim,
        local: evento.local || 'Não especificado',
        orgaos: orgaosStr,
        situacao: evento.situacao || 'Desconhecida',
        urlRegistro
      }
    })

    return new Response(
      JSON.stringify({ eventos: eventosFormatados }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Erro no processamento da agenda do senado:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
