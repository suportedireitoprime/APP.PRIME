// @ts-nocheck
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
                    const dataSessao = sessao.Data // "2026-09-17"
                    const horaStr = sessao.Hora // "14:00"
                    const horaInicio = dataSessao && horaStr ? `${dataSessao}T${horaStr}:00` : ''
                    
                    const materiasRaw = sessao.Materias?.Materia
                    const materiasArray = Array.isArray(materiasRaw) ? materiasRaw : [materiasRaw].filter(Boolean)
                    
                    const partesDesc: string[] = []
                    
                    if (sessao.Evento?.DescricaoEvento) {
                        partesDesc.push(`**Finalidade:**\n${sessao.Evento.DescricaoEvento}`)
                    }

                    const req = sessao.Evento?.OrigemAutor?.Requerimento
                    if (req) {
                        const autor = req.NomeAutor ? ` (Autoria: ${req.NomeAutor})` : ''
                        const aprov = req.DataAprovacao ? ` - Aprovado em ${req.DataAprovacao}` : ''
                        partesDesc.push(`**Requerimento(s):**\n${req.Origem || 'Requerimento'}${autor}${aprov}`)
                    }

                    if (materiasArray.length > 0) {
                        const materiasText = materiasArray.map((m: any) => `${m.DescricaoIdentificacaoMateria || m.Identificacao || ''} - ${m.Ementa || ''}`).join('\n\n')
                        partesDesc.push(`**Ordem do Dia / Matérias:**\n${materiasText}`)
                    }

                    const pauta = partesDesc.length > 0 ? partesDesc.join('\n\n') : 'Sem pauta cadastrada'
                    const urlRegistro = `https://www25.senado.leg.br/web/atividade/sessao-plenaria/-/pauta/${sessao.CodigoSessao}`

                    eventosFormatados.push({
                        codigo_sessao: `PLEN-${sessao.CodigoSessao}`,
                        titulo: sessao.TipoSessao ? sessao.TipoSessao.trim() : 'Sessão Plenária',
                        descricao: pauta,
                        hora_inicio: horaInicio,
                        hora_fim: '',
                        local: sessao.LocalSessao || 'Plenário do Senado Federal',
                        orgaos: 'Plenário',
                        situacao: sessao.SituacaoSessao || 'Agendada',
                        url_registro: urlRegistro
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
                const titulo = [evento.tipo, evento.descricaoSessao].filter(Boolean).join(' ')
                
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
                if (!urlRegistro && evento.codigo) {
                    urlRegistro = `https://legis.senado.leg.br/comissoes/reuniao?codereuniao=${evento.codigo}`
                }

                const partesComissao: string[] = []
                if (evento.finalidade) {
                    partesComissao.push(`**Finalidade:**\n${evento.finalidade}`)
                }

                const materiasRaw = evento.materias?.materia
                const materiasArray = Array.isArray(materiasRaw) ? materiasRaw : [materiasRaw].filter(Boolean)
                if (materiasArray.length > 0) {
                    const pautaMaterias = materiasArray.map((m: any) => m.descricao).join('\n\n')
                    partesComissao.push(`**Pauta da Comissão:**\n${pautaMaterias}`)
                }

                const descricaoFinal = partesComissao.length > 0 ? partesComissao.join('\n\n') : (evento.descricaoSessao || 'Sem pauta cadastrada')

                eventosFormatados.push({
                    codigo_sessao: `COM-${evento.codigo}`,
                    titulo: titulo || 'Reunião de Comissão',
                    descricao: descricaoFinal,
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
