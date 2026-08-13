import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { targetUrl, maxAgeYears = 5 } = await req.json();

    if (!targetUrl || !targetUrl.includes('planalto.gov.br')) {
      return new Response(JSON.stringify({ error: "URL inválida ou não pertence ao planalto.gov.br" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const browserlessUrl = Deno.env.get("BROWSERLESS_URL") || `wss://chrome.browserless.io?token=${Deno.env.get("BROWSERLESS_API_KEY")}`;
    
    let browser;
    try {
        browser = await puppeteer.connect({
            browserWSEndpoint: browserlessUrl
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "Falha ao conectar no Browserless", details: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const page = await browser.newPage();
    
    // Simular header para evitar bloqueio
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    });

    console.log(`Raspando URL: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const updates = await page.evaluate((maxAge) => {
        const found = [];
        const currentYear = new Date().getFullYear();
        // O Planalto geralmente coloca as alterações dentro de pequenos spans com strike, ou links em itálico.
        // Vamos procurar links (a) e spans que contenham "Redação dada pela Lei" ou "Incluído pela Lei".
        
        // Pega todos os links (tags <a>) na página
        const elements = document.querySelectorAll('a, span, p, font');
        
        // Helper para descobrir de qual Artigo essa alteração pertence e extrair os textos
        const extractArticleData = (element) => {
           let parent = element.parentElement;
           let count = 0;
           // Vamos tentar achar a tag âncora name="artX" ou subir pro body do artigo
           while (parent && count < 10) {
               if (parent.tagName === 'P' && parent.textContent?.trim().startsWith('Art.')) {
                   break;
               }
               parent = parent.parentElement;
               count++;
           }
           
           // Se não achou um parágrafo começando com Art., tenta olhar os irmãos anteriores (como estava antes)
           let startElement = parent || element;
           let prev = startElement.previousElementSibling;
           let artNum = null;
           count = 0;
           while (prev && count < 20) {
              if (prev.textContent && prev.textContent.trim().startsWith('Art.')) {
                 artNum = prev.textContent.trim().split(' ')[1]?.replace('.', '');
                 break;
              }
              prev = prev.previousElementSibling;
              count++;
           }
           
           if (!artNum) return null;

           // Capturar o texto Antigo (strike) e Novo (resto) que ficam perto deste elemento alterado
           let textoAntigo = "";
           let textoNovo = "";
           
           if (element.parentElement && element.parentElement.tagName === 'P') {
               const p = element.parentElement;
               const strike = p.querySelector('strike');
               if (strike) {
                   textoAntigo = strike.textContent.trim();
                   textoNovo = p.textContent.replace(textoAntigo, '').trim();
               } else {
                   textoNovo = p.textContent.trim();
               }
           } else {
               textoNovo = element.textContent.trim();
           }

           return { artNum, textoAntigo, textoNovo };
        };

        elements.forEach(el => {
            const text = el.textContent || '';
            const isChange = text.includes('Redação dada pela Lei') || text.includes('Incluído pela Lei');
            
            if (isChange) {
                const yearMatch = text.match(/de\s+(\d{4})/);
                if (yearMatch) {
                    const ano = parseInt(yearMatch[1], 10);
                    if (currentYear - ano <= maxAge) {
                        const data = extractArticleData(el);
                        if (data) {
                            found.push({
                                artigo: `Art. ${data.artNum}`,
                                motivo: text.trim().replace(/[()]/g, ''),
                                ano: ano,
                                texto_antigo: data.textoAntigo,
                                texto_novo: data.textoNovo
                            });
                        }
                    }
                }
            }
        });
        
        // Remove duplicatas (um artigo pode ter sido alterado mais de uma vez)
        const unique = Array.from(new Map(found.map(item => [item.artigo, item])).values());
        return unique.sort((a, b) => b.ano - a.ano); // Mais recentes primeiro
    }, maxAgeYears);

    await browser.close();

    return new Response(JSON.stringify({ success: true, articles: updates }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
