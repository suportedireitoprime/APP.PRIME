import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

const STF_YOUTUBE_RSS = "https://www.youtube.com/feeds/videos.xml?channel_id=UC0qlZ5jxxueKNzUERcrllNw";
const STF_PAUTAS_URL = "https://portal.stf.jus.br/pauta/pesquisarCalendario.asp";

async function fetchYoutubeSessions() {
  console.log("Buscando feed do YouTube do STF...");
  const res = await fetch(STF_YOUTUBE_RSS);
  const text = await res.text();
  
  // Extração simples de XML sem dependência pesada
  const entries = text.split("<entry>");
  entries.shift(); // remove o cabeçalho
  
  const sessions = [];
  
  for (const entry of entries) {
    const titleMatch = entry.match(/<title>(.*?)<\/title>/);
    const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const pubMatch = entry.match(/<published>(.*?)<\/published>/);
    const descMatch = entry.match(/<media:description>(.*?)<\/media:description>/s);
    
    if (titleMatch && idMatch && pubMatch) {
      const title = titleMatch[1];
      const videoId = idMatch[1];
      const published = new Date(pubMatch[1]);
      const desc = descMatch ? descMatch[1] : "";
      
      // Filtra Sessões Plenárias ou TV Justiça Ao Vivo
      const titleLower = title.toLowerCase();
      if (titleLower.includes("plenári") || titleLower.includes("sessão") || titleLower.includes("tv justiça - ao vivo")) {
        sessions.push({ title, videoId, published, desc });
      }
    }
  }
  
  return sessions;
}

async function fetchPautasViaBrowserless() {
  if (!browserlessKey) {
    console.warn("BROWSERLESS_API_KEY não configurada. Retornando vazio.");
    return { pautas: [], upcomingSessions: [] };
  }
  
  console.log("Iniciando raspagem profunda via Browserless /function...");
  const endpoint = `https://production-sfo.browserless.io/function?token=${browserlessKey}`;
  
  // Puppeteer script to inject
  const code = `
    module.exports = async function({ page, context }) {
      const url = context.url || 'https://portal.stf.jus.br/pauta/pesquisarCalendario.asp';
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const data = await page.evaluate(async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const sessions = [];
        
        async function processMonth() {
          // Achar todos os dias clicáveis no calendário (geralmente tags <a> dentro de uma tabela)
          // O STF costuma usar jQuery UI ou estrutura similar
          const days = Array.from(document.querySelectorAll('.ui-datepicker-calendar a, table a.ui-state-default, a.cal-dia, td a'));
          
          for (let i = 0; i < days.length; i++) {
             // Re-query para evitar detached nodes
             const currentDays = Array.from(document.querySelectorAll('.ui-datepicker-calendar a, table a.ui-state-default, a.cal-dia, td a'));
             if (!currentDays[i]) continue;
             
             // Clica no dia e espera carregar o painel da direita
             currentDays[i].click();
             await sleep(2500); 
             
             // O painel costuma ter um cabeçalho com "Calendário de Julgamentos: dia DD/MM/YYYY"
             const bodyText = document.body.innerText;
             const dateMatch = bodyText.match(/Calendário de Julgamentos: dia (\\d{2}\\/\\d{2}\\/\\d{4})/i);
             if (!dateMatch) continue;
             
             const dateString = dateMatch[1];
             const [day, month, year] = dateString.split('/');
             const isoDate = \`\${year}-\${month}-\${day}T14:00:00Z\`; // STF plenary is usually 14:00
             
             // Clicar em todos os "Ver Tema" visíveis para expandir a pauta
             const verTemaBtns = Array.from(document.querySelectorAll('a, button, span, div')).filter(el => el.innerText && el.innerText.trim().toLowerCase() === 'ver tema');
             for (const btn of verTemaBtns) {
               try { btn.click(); } catch(e) {}
               await sleep(300);
             }
             
             // Agora o HTML está expandido. Vamos capturar o HTML da div principal da direita para parsear depois,
             // ou extrair diretamente aqui se os seletores forem óbvios.
             // Como a estrutura exata de classes varia, vamos pegar o container que possui o texto do dia.
             let containerHtml = '';
             let sessionTitle = "Sessão Plenária";
             
             // Procura por "SESSÃO EXTRAORDINÁRIA" ou "SESSÃO ORDINÁRIA" no texto
             const titleMatch = bodyText.match(/(\\d+ª SESSÃO (?:EXTRAORDINÁRIA|ORDINÁRIA))/i);
             if (titleMatch) {
               sessionTitle = titleMatch[1];
             }
             
             // Vamos tentar extrair estruturado baseado em classes comuns do STF
             const agendas = [];
             const items = document.querySelectorAll('li.processo, .processo-item, tr.pauta, .card-processo');
             
             if (items.length > 0) {
                items.forEach(item => {
                   const processNumber = item.querySelector('.numero-processo, .classe-numero, h4, .titulo')?.innerText.trim() || '';
                   const relator = item.querySelector('.relator')?.innerText.trim() || '';
                   const theme = item.querySelector('.tema, .resumo, .assunto, .texto-expandido, .collapse, .descricao')?.innerText.trim() || '';
                   if (processNumber && processNumber.length > 2) {
                     agendas.push({ processNumber, relator, theme });
                   }
                });
             } else {
                // Se não achou classes conhecidas, pega todo o container da direita para não perder os dados
                // Geralmente o calendário fica na esquerda (col-md-4) e o resultado na direita (col-md-8)
                const rightPanels = Array.from(document.querySelectorAll('.col-md-8, .conteudo-pauta, #divDetalhePauta'));
                if (rightPanels.length > 0) {
                  containerHtml = rightPanels[0].innerHTML;
                } else {
                  containerHtml = document.body.innerHTML; // fallback
                }
             }
             
             sessions.push({
               title: sessionTitle,
               scheduled_at: isoDate,
               description: \`Sessão de julgamento do plenário agendada para \${dateString}\`,
               htmlFallback: containerHtml,
               agendas
             });
          }
        }
        
        // Processa mês atual
        await processMonth();
        
        // Clica para o próximo mês (geralmente classe ui-datepicker-next ou similar)
        const nextBtn = document.querySelector('.ui-datepicker-next, a[title="Próximo Mês"], .btn-next-month');
        if (nextBtn) {
           nextBtn.click();
           await sleep(3000);
           await processMonth();
        }
        
        return sessions;
      });
      
      return { data, type: 'application/json' };
    };
  `;
  
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: code,
      context: { url: STF_PAUTAS_URL } // We could pass the url here
    })
  });
  
  if (!res.ok) {
    console.error("Erro na API /function do Browserless:", await res.text());
    return { upcomingSessions: [] };
  }
  
  const resultData = await res.json();
  const scrapedSessions = resultData || [];
  
  const upcomingSessions = [];
  const pautas = []; // We will map agendas internally in the main loop
  
  // Como as Edge Functions suportam ESM.sh, vamos usar Cheerio no fallback se necessário
  const cheerio = await import("https://esm.sh/cheerio@1.0.0-rc.12");
  
  for (const session of scrapedSessions) {
     upcomingSessions.push({
        title: session.title,
        scheduled_at: session.scheduled_at,
        description: session.description,
        agendas: session.agendas || [],
        htmlFallback: session.htmlFallback
     });
  }
  
  return { pautas: [], upcomingSessions };
}

serve(async (req) => {
  try {
    const youtubeSessions = await fetchYoutubeSessions();
    const browserlessData = await fetchPautasViaBrowserless();
    const pautas = browserlessData.pautas || [];
    const upcomingSessions = browserlessData.upcomingSessions || [];
    
    console.log(`Encontradas ${youtubeSessions.length} sessões no YouTube.`);
    console.log(`Encontradas ${pautas.length} pautas via Browserless.`);
    
    const results = [];
    
    for (const ys of youtubeSessions) {
      // 1. Inserir/Atualizar Sessão do YouTube
      const { data: existing, error: findError } = await supabase
        .from('stf_sessions')
        .select('id, status, scheduled_at')
        .eq('youtube_video_id', ys.videoId)
        .maybeSingle();
        
      const isAoVivo = ys.title.toLowerCase().includes("vivo") || ys.title.toLowerCase().includes("transmissão");
      const status = isAoVivo ? 'live' : 'finished';
      
      if (existing) {
        if (existing.status !== status) {
          await supabase.from('stf_sessions').update({ status }).eq('id', existing.id);
        }
        results.push({ action: 'updated_youtube', videoId: ys.videoId });
      } else {
        // Tenta achar uma sessão futura no mesmo dia para fazer merge
        const ysDate = ys.published.toISOString().split('T')[0];
        const { data: existingDate } = await supabase
          .from('stf_sessions')
          .select('id')
          .like('scheduled_at', `${ysDate}%`)
          .maybeSingle();

        if (existingDate) {
           await supabase.from('stf_sessions').update({
             youtube_video_id: ys.videoId,
             status: status,
             title: ys.title
           }).eq('id', existingDate.id);
           results.push({ action: 'merged_youtube', videoId: ys.videoId });
        } else {
          await supabase
            .from('stf_sessions')
            .insert({
              title: ys.title,
              youtube_video_id: ys.videoId,
              scheduled_at: ys.published.toISOString(),
              description: ys.desc.substring(0, 500),
              status: status
            });
          results.push({ action: 'inserted_youtube', videoId: ys.videoId });
        }
      }
    }

    // 2. Inserir/Atualizar sessões futuras capturadas do Browserless e suas Pautas
    for (const upcoming of upcomingSessions) {
      const upDate = upcoming.scheduled_at.split('T')[0];
      const { data: existingFuture } = await supabase
        .from('stf_sessions')
        .select('id')
        .like('scheduled_at', `${upDate}%`)
        .maybeSingle();

      let sessionId = null;

      if (!existingFuture) {
        const { data: inserted } = await supabase
          .from('stf_sessions')
          .insert({
            title: upcoming.title,
            scheduled_at: upcoming.scheduled_at,
            description: upcoming.description,
            status: 'scheduled',
            html_fallback: upcoming.htmlFallback
          })
          .select('id')
          .single();
          
        if (inserted) {
          sessionId = inserted.id;
          results.push({ action: 'inserted_scheduled', date: upcoming.scheduled_at });
        }
      } else {
        sessionId = existingFuture.id;
        await supabase
          .from('stf_sessions')
          .update({ 
             description: upcoming.description,
             html_fallback: upcoming.htmlFallback
          })
          .eq('id', sessionId);
      }

      // Inserir Agendas associadas
      if (sessionId && upcoming.agendas && upcoming.agendas.length > 0) {
        // Remove antigas para evitar duplicidade
        await supabase.from('stf_session_agendas').delete().eq('session_id', sessionId);
        
        const agendasToInsert = upcoming.agendas.map((p: any, index: number) => ({
          session_id: sessionId,
          process_number: (p.processNumber || '').substring(0, 100),
          relator: (p.relator || '').substring(0, 100),
          theme: p.theme,
          order_index: index
        }));
        
        await supabase.from('stf_session_agendas').insert(agendasToInsert);
      }
    }

    return new Response(JSON.stringify({ success: true, results, youtubeSessions, upcomingSessions }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
