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
    const datesToFetch: string[] = []
    for(let i = 0; i < 8; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        datesToFetch.push(d.toISOString().split('T')[0].replace(/-/g, ''))
    }

    const eventosFormatados: any[] = []

    console.log("Iniciando busca de Pautas do Plenário...")
    // 1. Fetch Plenário (1 request por dia)
    for (const dateStr of datesToFetch) {
        try {
            const urlPlenario = `https://legis.senado.leg.br/dadosabertos/plenario/agenda/dia/${dateStr}`
            const resP = await fetch(urlPlenario, { headers: { 'Accept': 'application/json' } })
            if (resP.ok) {
                const dataP = await resP.json()
                const sessoesRaw = dataP?.AgendaPlenario?.Sessoes?.Sessao || []
                const sessoes = Array.isArray(sessoesRaw) ? sessoesRaw : [sessoesRaw]
                
                for (const sessao of sessoes.filter(Boolean)) {
                    const dataSessao = sessao.Data // "2024-09-17"
                    const horaStr = sessao.Hora // "14:00"
                    const horaInicio = dataSessao && horaStr ? `${dataSessao}T${horaStr}:00` : ''
                    
                    const materiasRaw = sessao.Materias?.Materia
                    const materiasArray = Array.isArray(materiasRaw) ? materiasRaw : [materiasRaw].filter(Boolean)
                    const pauta = materiasArray.map((m: any) => `${m.DescricaoIdentificacaoMateria || m.Identificacao || ''} - ${m.Ementa || ''}`).join('\n\n')

                    eventosFormatados.push({
                        codigo_sessao: `PLEN-${sessao.CodigoSessao}`,
                        titulo: sessao.TipoSessao || 'Sessão Plenária',
                        descricao: pauta || 'Sem pauta cadastrada',
                        hora_inicio: horaInicio,
                        hora_fim: '',
                        local: sessao.LocalSessao || 'Plenário do Senado Federal',
                        orgaos: 'Plenário',
                        situacao: sessao.SituacaoSessao || 'Agendada',
                        url_registro: ''
                    })
                }
            }
        } catch (err) {
            console.error(`Erro ao buscar plenário para ${dateStr}:`, err)
        }
    }

    console.log("Iniciando busca de Pautas das Comissões...")
    // 2. Fetch Comissões
    const startComissao = datesToFetch[0]
    const endComissao = datesToFetch[datesToFetch.length - 1]
    const urlComissao = `https://legis.senado.leg.br/dadosabertos/comissao/agenda/${startComissao}/${endComissao}`
    
    try {
        const resC = await fetch(urlComissao, { headers: { 'Accept': 'application/json' } })
        if (resC.ok) {
            const dataC = await resC.json()
            const reunioesRaw = dataC?.AgendaReuniao?.reunioes?.reuniao || []
            const reunioes = Array.isArray(reunioesRaw) ? reunioesRaw : [reunioesRaw]

            for (const evento of reunioes.filter(Boolean)) {
                const dataStr = evento.data
                const horaStr = evento.hora
                const horaInicio = dataStr && horaStr ? `${dataStr}T${horaStr}` : ''
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

                eventosFormatados.push({
                    codigo_sessao: `COM-${evento.codigo}`,
                    titulo: titulo || 'Reunião de Comissão',
                    descricao: pauta,
                    hora_inicio: horaInicio,
                    hora_fim: evento.dataHoraFim || '',
                    local: evento.local || 'Não especificado',
                    orgaos: orgaosStr,
                    situacao: evento.situacao || 'Desconhecida',
                    url_registro: urlRegistro
                })
            }
        }
    } catch (err) {
        console.error(`Erro ao buscar comissões:`, err)
    }

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
