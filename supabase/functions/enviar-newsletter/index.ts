import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.13'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const GMAIL_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')
    if (!GMAIL_PASSWORD) throw new Error('GMAIL_APP_PASSWORD not configured')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Setup Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'aviso.direitoprime@gmail.com',
        pass: GMAIL_PASSWORD,
      },
    })

    // Determine current hour in BRT (UTC-3)
    const now = new Date()
    const brtTime = new Date(now.getTime() - (3 * 60 * 60 * 1000))
    const currentHourBrt = brtTime.getUTCHours() 
    const isFriday = brtTime.getUTCDay() === 5 // 0 = Sun, 5 = Fri
    const today = brtTime.toISOString().slice(0, 10)

    // Manual override for testing via API (e.g. ?forceHour=7 or ?forceAll=true)
    const url = new URL(req.url)
    const forceHour = url.searchParams.get('forceHour')
    const forceAll = url.searchParams.get('forceAll') === 'true'
    const activeHour = forceHour ? parseInt(forceHour) : currentHourBrt

    console.log(`Running Newsletter Job for BRT Hour: ${activeHour}, Date: ${today}, ForceAll: ${forceAll}`)

    // Check if there's anything to send at this hour
    const shouldSendNoticias = forceAll || activeHour === 7
    const shouldSendLeis = forceAll || activeHour === 8
    const shouldSendRadar = forceAll || activeHour === 12
    const shouldSendBoletins = forceAll || activeHour === 17
    const shouldSendTematica = forceAll || (activeHour === 18 && isFriday)

    if (!shouldSendNoticias && !shouldSendLeis && !shouldSendRadar && !shouldSendBoletins && !shouldSendTematica) {
      return new Response(JSON.stringify({ success: true, message: `No scheduled topics for hour ${activeHour}`, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('ativo', true)

    if (subError) throw subError
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No active subscribers', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch user profiles for names
    const userIds = subscribers.map(s => s.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)
    
    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p.display_name]))

    // Fetch content based on current hour
    let noticias = [], resenha = [], alteracoes = [], tematicas = [], boletins = []

    if (shouldSendNoticias) {
      const { data } = await supabase
        .from('noticias_camara')
        .select('titulo,resumo,link,imagem_url')
        .order('data_publicacao', { ascending: false })
        .limit(3)
      noticias = data || []
      if (forceAll && noticias.length === 0) {
        noticias = [{
          titulo: 'Câmara aprova novo projeto de modernização do processo civil',
          resumo: 'A proposta visa celeridade processual e ampliação dos meios digitais para intimação e audiências.',
          link: 'https://vademecum-legal-guide.Gemini.app/noticias'
        }]
      }
    }

    if (shouldSendLeis) {
      const { data } = await supabase
        .from('resenha_diaria')
        .select('tipo_ato,numero_ato,ementa,url')
        .order('data_dou', { ascending: false })
        .limit(3)
      resenha = data || []
      if (forceAll && resenha.length === 0) {
        resenha = [{
          tipo_ato: 'Lei Ordinária',
          numero_ato: 'Nº 15.487, de 6.8.2026',
          ementa: 'Altera dispositivos do Código de Processo Penal para reforçar as garantias do contraditório.',
          url: 'https://vademecum-legal-guide.Gemini.app/resenha-diaria'
        }]
      }
    }

    if (shouldSendRadar) {
      const { data } = await supabase
        .from('legislacao_alteracoes')
        .select('lei_alteradora,artigo_numero,tipo_alteracao,tabela_nome')
        .order('data_publicacao', { ascending: false })
        .limit(3)
      alteracoes = data || []
      if (forceAll && alteracoes.length === 0) {
        alteracoes = [{
          tipo_alteracao: 'Nova Redação',
          artigo_numero: 'Art. 312 do Código Penal',
          lei_alteradora: 'Lei 15.480/2026'
        }]
      }
    }

    if (shouldSendTematica) {
      const { data } = await supabase
        .from('tematica_juridica')
        .select('titulo,tipo,sinopse,ano,capa_url,id')
        .order('created_at', { ascending: false })
        .limit(1)
      tematicas = data || []
      if (forceAll && tematicas.length === 0) {
        tematicas = [{
          id: 'demo',
          titulo: 'O Julgamento de Chicago 7',
          tipo: 'Filme',
          ano: 2020,
          sinopse: 'O que deveria ser um protesto pacífico transformou-se em um confronto violento com a polícia e em um dos julgamentos mais notórios da história.',
          capa_url: ''
        }]
      }
    }

    if (shouldSendBoletins) {
      const { data } = await supabase
        .from('boletins_juridicos')
        .select('titulo,descricao,video_id,created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      boletins = data || []
      if (forceAll && boletins.length === 0) {
        boletins = [{
          titulo: 'Análise de Impacto STF: Repercussão Geral no Direito Tributário',
          descricao: 'Entenda os principais pontos da recente tese fixada pelo Supremo Tribunal Federal.'
        }]
      }
    }

    let sentCount = 0
    const errors: string[] = []

    for (const sub of subscribers) {
      const prefs = forceAll ? { noticias: true, leis_do_dia: true, radar_legislativo: true, tematica_juridica: true, boletins_juridicos: true } : (sub.preferencias || {})
      const sections: string[] = []

      // Build personalized HTML based on preferences and fetched data
      if (shouldSendNoticias && prefs.noticias && noticias.length) {
        sections.push(buildNoticiasSection(noticias))
      }
      if (shouldSendLeis && prefs.leis_do_dia && resenha.length) {
        sections.push(buildResenhaSection(resenha))
      }
      if (shouldSendRadar && prefs.radar_legislativo && alteracoes.length) {
        sections.push(buildAlteracoesSection(alteracoes))
      }
      if (shouldSendTematica && prefs.tematica_juridica && tematicas.length) {
        sections.push(buildTematicaSection(tematicas[0]))
      }
      if (shouldSendBoletins && prefs.boletins_juridicos && boletins.length) {
        sections.push(buildBoletimSection(boletins[0]))
      }

      if (sections.length === 0) continue

      const userName = profileMap[sub.user_id] || 'Estudante'
      const html = buildEmailHTML(sections, today, userName, forceAll)

      let subject = forceAll ? `📋 Resumo Jurídico Completo (5 Tópicos) — ${today}` : `📋 Resumo Jurídico — ${today}`
      if (!forceAll && sections.length === 1) {
        if (shouldSendNoticias) subject = `📰 Notícias Jurídicas — ${today}`
        if (shouldSendLeis) subject = `📜 Leis do Dia (DOU) — ${today}`
        if (shouldSendRadar) subject = `🔔 Radar Legislativo — ${today}`
        if (shouldSendTematica) subject = `🎬 Recomendação de Sexta — ${today}`
        if (shouldSendBoletins) subject = `📺 Novo Boletim Jurídico — ${today}`
      }

      try {
        await transporter.sendMail({
          from: '"Direito Newsletter" <aviso.direitoprime@gmail.com>',
          to: sub.email,
          subject,
          html,
        })

        sentCount++
        await supabase
          .from('newsletter_subscriptions')
          .update({ ultimo_envio: new Date().toISOString() })
          .eq('id', sub.id)
          
      } catch (e: any) {
        errors.push(`${sub.email}: ${e.message}`)
      }

      await new Promise(r => setTimeout(r, 200))
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, errors: errors.length, errorDetails: errors.slice(0, 5) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('Newsletter error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ---- HTML Builders ----

function getSvgIcon(type: string): string {
  switch (type) {
    case 'newspaper':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`
    case 'book':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`
    case 'radar':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><path d="M12 12h.01"/><path d="M16.8 12c0 2.65-2.15 4.8-4.8 4.8s-4.8-2.15-4.8-4.8 2.15-4.8 4.8-4.8 4.8 2.15 4.8 4.8Z"/></svg>`
    case 'film':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>`
    case 'video':
      return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`
    default:
      return ''
  }
}

function buildEmailHTML(sections: string[], date: string, userName: string, forceAll: boolean): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0D0D0D;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#FFFFFF;width:100% !important;}
  .container{width:100%;max-width:100%;margin:0;background:#0D0D0D;}
  .header-content{padding:24px 20px 16px 20px;background:#111111;border-bottom:1px solid #1F1F1F;}
  .greeting{font-size:22px;color:#FFFFFF;font-weight:800;margin-bottom:8px;}
  .description{font-size:15px;color:#BBBBBB;line-height:1.5;margin:0;}
  .section{padding:24px 20px 8px 20px;}
  .section-title{display:flex;align-items:center;gap:8px;color:#DC2626;font-size:14px;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;font-weight:800;}
  .item{margin-bottom:16px;padding:16px;background:#1A1A1A;border-radius:12px;border:1px solid #2A2A2A;}
  .item h3{margin:0 0 8px;font-size:16px;color:#FFFFFF;line-height:1.4;font-weight:700;}
  .item p{margin:0 0 12px;font-size:14px;color:#AAAAAA;line-height:1.5;}
  .item a{display:inline-block;color:#DC2626;text-decoration:none;font-size:14px;font-weight:600;}
  .app-button-container{padding:32px 20px;text-align:center;}
  .app-button{display:inline-block;background:#DC2626;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:700;padding:16px 32px;border-radius:12px;width:80%;max-width:300px;text-align:center;box-shadow:0 4px 12px rgba(220, 38, 38, 0.3);}
  .footer{padding:24px 20px;text-align:center;font-size:13px;color:#666666;border-top:1px solid #1F1F1F;background:#0A0A0A;}
  .footer a{color:#888888;text-decoration:underline;}
  .cover-img{width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin-bottom:16px;}
</style>
</head>
<body>
<div class="container">
  
  <div class="header-content">
    <div class="greeting">Olá, ${escapeHtml(userName)}! 👋</div>
    <p class="description">
      Aqui está o seu resumo jurídico de hoje, organizado especialmente para você. Acompanhe as principais leis do dia, movimentações no legislativo e novidades do mundo jurídico para manter-se sempre atualizado de forma rápida e prática.
    </p>
  </div>
  
  ${sections.join('')}
  
  <div class="app-button-container">
    <p style="color:#BBBBBB; font-size:14px; margin-bottom:16px;">Você pode acompanhar todas essas leis, notícias e muito mais diretamente no aplicativo!</p>
    <a href="https://vademecum-legal-guide.Gemini.app/" class="app-button">Acessar Aplicativo</a>
  </div>

  <div class="footer">
    <p>Este e-mail foi gerado automaticamente de acordo com as suas preferências no APP PRIME.</p>
    <p>Para alterar os horários ou cancelar inscrições, acesse o <a href="https://vademecum-legal-guide.Gemini.app/newsletter">painel do aplicativo</a>.</p>
  </div>
</div>
</body>
</html>`
}

function buildNoticiasSection(noticias: any[]): string {
  const items = noticias.map(n => `
    <div class="item">
      <h3>${escapeHtml(n.titulo)}</h3>
      <p>${escapeHtml(n.resumo?.slice(0, 140) || '')}...</p>
      ${n.link ? `<a href="${n.link}" target="_blank">Ler a notícia completa →</a>` : ''}
    </div>`).join('')
  return `<div class="section"><div class="section-title">${getSvgIcon('newspaper')} NOTÍCIAS JURÍDICAS</div>${items}</div>`
}

function buildResenhaSection(resenha: any[]): string {
  const items = resenha.map(r => `
    <div class="item">
      <h3>${escapeHtml(r.tipo_ato)} ${escapeHtml(r.numero_ato)}</h3>
      <p>${escapeHtml(r.ementa?.slice(0, 160) || '')}</p>
      ${r.url ? `<a href="${r.url}" target="_blank">Acessar no Diário Oficial →</a>` : ''}
    </div>`).join('')
  return `<div class="section"><div class="section-title">${getSvgIcon('book')} LEIS DO DIA</div>${items}</div>`
}

function buildAlteracoesSection(alteracoes: any[]): string {
  const items = alteracoes.map(a => `
    <div class="item">
      <h3>${escapeHtml(a.tipo_alteracao || 'Alteração')} — ${escapeHtml(a.artigo_numero)}</h3>
      <p>Lei alteradora responsável: <strong>${escapeHtml(a.lei_alteradora || 'N/A')}</strong></p>
    </div>`).join('')
  return `<div class="section"><div class="section-title">${getSvgIcon('radar')} RADAR LEGISLATIVO</div>${items}</div>`
}

function buildTematicaSection(t: any): string {
  return `<div class="section">
    <div class="section-title">${getSvgIcon('film')} RECOMENDAÇÃO DE SEXTA</div>
    <div class="item">
      ${t.capa_url ? `<img src="${t.capa_url}" class="cover-img" alt="Capa" />` : ''}
      <h3>${escapeHtml(t.titulo)} (${t.ano}) — ${escapeHtml(t.tipo)}</h3>
      <p>${escapeHtml(t.sinopse)}</p>
      <a href="https://vademecum-legal-guide.Gemini.app/tematica-juridica/${t.id}" target="_blank">Ver detalhes no app →</a>
    </div>
  </div>`
}

function buildBoletimSection(b: any): string {
  return `<div class="section">
    <div class="section-title">${getSvgIcon('video')} BOLETIM JURÍDICO RECENTE</div>
    <div class="item">
      <h3>${escapeHtml(b.titulo)}</h3>
      <p>${escapeHtml(b.descricao)}</p>
      <a href="https://vademecum-legal-guide.Gemini.app/boletins" target="_blank">Assistir ao vídeo agora →</a>
    </div>
  </div>`
}

function escapeHtml(str: string): string {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
