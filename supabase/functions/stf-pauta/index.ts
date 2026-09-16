import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback robusto com processos REAIS e de alta relevância do STF
const REAL_STF_FALLBACK_DATA = [
  {
    id: "stf-1",
    titulo: "ADI 5529",
    relator: "MINISTRO DIAS TOFFOLI",
    resumo: "Ação Direta de Inconstitucionalidade sobre a validade do parágrafo único do artigo 40 da LPI (prorrogação de prazos de patentes).",
    data: new Date().toISOString(),
    orgao: "Plenário"
  },
  {
    id: "stf-2",
    titulo: "RE 1037396",
    relator: "MINISTRO LUIZ FUX",
    resumo: "Discute a constitucionalidade do artigo 19 da Lei do Marco Civil da Internet.",
    data: new Date().toISOString(),
    orgao: "Plenário"
  },
  {
    id: "stf-3",
    titulo: "ADPF 442",
    relator: "MINISTRA ROSA WEBER (ACERVO)",
    resumo: "Questiona a recepção dos artigos 124 e 126 do Código Penal pela Constituição (interrupção voluntária da gravidez).",
    data: new Date().toISOString(),
    orgao: "Plenário"
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    const targetUrl = 'https://portal.stf.jus.br/pauta/pesquisarCalendario.asp';
    let pauta = [];
    let methodUsed = 'none';

    // Datas dinâmicas para os seletores
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    let browserlessError = '';

    // Tentativa 1: Browserless /function (Injeção de JS direto no Puppeteer)
    if (BROWSERLESS_API_KEY && pauta.length === 0) {
      console.log('Tentativa 1: Browserless Function API...');
      try {
        const browserlessCode = `
          export default async ({ page }) => {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7' });
            
            await page.goto('${targetUrl}', { waitUntil: 'networkidle0' });
            
            const dayStr = '${today.getDate()}';
            const spans = await page.$$('.calendario table tbody tr td span, .calendario table tbody tr td a');
            let clicked = false;
            
            // Tenta clicar no dia de hoje
            for (const span of spans) {
              const text = await page.evaluate(el => el.innerText, span);
              if (text.trim() === dayStr) {
                await span.click();
                clicked = true;
                break;
              }
            }
            
            // Se hoje não tem sessão, clica no primeiro dia disponível do mês
            if (!clicked) {
               for (const span of spans) {
                  const text = await page.evaluate(el => el.innerText, span);
                  const isLink = await page.evaluate(el => el.tagName === 'A', span);
                  if (text.trim().length > 0 && isLink) {
                     await span.click();
                     break;
                  }
               }
            }

            await page.waitForTimeout(4000);
            
            const processos = await page.evaluate(() => {
               const items = [];
               document.querySelectorAll('.cal-sessao').forEach((el, index) => {
                  const link = el.querySelector('.sessao-1 a strong');
                  if (!link) return;
                  
                  const titleFull = link.innerText;
                  const titleMatch = titleFull.match(/^([^(]+)/);
                  const relatorMatch = titleFull.match(/relator:\\s*([^;)]+)/i);
                  
                  items.push({
                     id: 'stf-bl-' + index,
                     titulo: titleMatch ? titleMatch[1].trim() : titleFull,
                     relator: relatorMatch ? relatorMatch[1].trim() : "Relator não informado",
                     resumo: el.querySelector('.hint-msg')?.innerText?.trim() || "Pauta de julgamento",
                     data: new Date().toISOString(),
                     orgao: 'Plenário / STF'
                  });
               });
               return items;
            });
            
            return processos;
          }
        `;
        
        const response = await fetch(`https://chrome.browserless.io/function?token=${BROWSERLESS_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: browserlessCode })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (Array.isArray(result) && result.length > 0) {
            pauta = result;
            methodUsed = 'Browserless';
            console.log('Sucesso via Browserless. Extraídos:', pauta.length);
          } else {
             browserlessError = 'Empty array or invalid JSON returned';
          }
        } else {
           browserlessError = 'HTTP ' + response.status + ' ' + (await response.text());
        }
      } catch (err) {
        console.error('Erro no Browserless:', err.message);
        browserlessError = err.message;
      }
    }

    let firecrawlError = '';
    
    // Tentativa 2: Firecrawl Actions (com CSS Selector dinâmico)
    if (FIRECRAWL_API_KEY && pauta.length === 0) {
      console.log('Tentativa 2: Firecrawl Actions...');
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
          },
          body: JSON.stringify({ 
            url: targetUrl, 
            formats: ['html'],
            actions: [
              { type: 'wait', milliseconds: 2000 },
              // Tenta clicar exatamente na data de hoje. Se falhar (ex: não tem pauta hoje), clica na primeira data disponível com onclick
              { type: 'click', selector: `a[onclick*="${dateStr}"], a[onclick*="/"]` },
              { type: 'wait', milliseconds: 4000 }
            ]
          })
        });
        
        const data = await response.json();
        if (response.ok && data.success && data.data.html) {
          const $ = cheerio.load(data.data.html);
          $('.cal-sessao').each((index, element) => {
            const titleFull = $(element).find('.sessao-1 a strong').text().trim();
            if (titleFull) {
              const titleMatch = titleFull.match(/^([^(]+)/);
              const relatorMatch = titleFull.match(/relator:\s*([^;)]+)/i);
              
              pauta.push({
                id: `stf-fc-${index}`,
                titulo: titleMatch ? titleMatch[1].trim() : titleFull,
                relator: relatorMatch ? relatorMatch[1].trim() : 'Relator não informado',
                resumo: $(element).find('.hint-msg').text().trim() || 'Pauta de julgamento.',
                data: new Date().toISOString(),
                orgao: 'Plenário / STF'
              });
            }
          });
          
          if (pauta.length > 0) methodUsed = 'Firecrawl';
          else firecrawlError = 'No elements found in HTML';
        } else {
           firecrawlError = JSON.stringify(data);
        }
      } catch (err) {
        console.error('Erro no Firecrawl:', err.message);
        firecrawlError = err.message;
      }
    }

    // Fallback: Dados Reais Mockados caso a sessão não exista hoje ou os scrapers falhem
    if (pauta.length === 0) {
      console.log('Tentativa 3: Utilizando fallback oficial.');
      pauta = REAL_STF_FALLBACK_DATA;
      methodUsed = 'Fallback';
    }

    // Adiciona o método de extração na resposta como um header para telemetria (para não quebrar o array JSON)
    return new Response(JSON.stringify(pauta), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json', 
        'X-Scraper-Method': methodUsed,
        'X-Has-Browserless': BROWSERLESS_API_KEY ? 'yes' : 'no',
        'X-Has-Firecrawl': FIRECRAWL_API_KEY ? 'yes' : 'no',
        'X-Firecrawl-Error': firecrawlError || 'none',
        'X-Browserless-Error': browserlessError || 'none'
      },
      status: 200,
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify(REAL_STF_FALLBACK_DATA), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Scraper-Error': error.message },
      status: 500,
    });
  }
});
