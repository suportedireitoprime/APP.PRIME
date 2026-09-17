import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase variables')

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Data de hoje e próximos 7 dias
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)

    const start = today.toISOString().split('T')[0].replace(/-/g, '')
    const end = nextWeek.toISOString().split('T')[0].replace(/-/g, '')

    const url = `https://legis.senado.leg.br/dadosabertos/comissao/agenda/${start}/${end}`
    console.log(`Buscando eventos do Senado (Sincronização): ${url}`)

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

    const eventosFormatados = reunioes.filter(Boolean).map((evento: any) => {
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
        codigo_sessao: String(evento.codigo),
        titulo: titulo || 'Sessão do Senado',
        descricao: pauta,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        local: evento.local || 'Não especificado',
        orgaos: orgaosStr,
        situacao: evento.situacao || 'Desconhecida',
        url_registro: urlRegistro
      }
    })

    if (eventosFormatados.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum evento encontrado para sincronizar." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    console.log(`Realizando upsert de ${eventosFormatados.length} eventos no banco de dados...`)
    
    // Upsert na tabela 'senado_pautas'
    const { error: upsertError } = await supabase
      .from('senado_pautas')
      .upsert(eventosFormatados, { onConflict: 'codigo_sessao' })

    if (upsertError) {
      throw upsertError
    }

    return new Response(
      JSON.stringify({ message: `Sincronizados ${eventosFormatados.length} eventos com sucesso.` }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Erro na sync da agenda do senado:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
