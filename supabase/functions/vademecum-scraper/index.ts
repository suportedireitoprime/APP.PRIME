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
        
        // Helper para descobrir de qual Artigo essa alteração pertence
        const findParentArticle = (element) => {
           let prev = element.previousElementSibling;
           let count = 0;
           // Sobe irmãos até achar "Art."
           while (prev && count < 20) {
              if (prev.textContent && prev.textContent.trim().startsWith('Art.')) {
                 return prev.textContent.trim().split(' ')[1]?.replace('.', '');
              }
              prev = prev.previousElementSibling;
              count++;
           }
           
           // Se não achou nos irmãos, tenta subir pro parent e ver os irmãos dele
           if (element.parentElement) {
               prev = element.parentElement.previousElementSibling;
               count = 0;
               while (prev && count < 10) {
                   if (prev.textContent && prev.textContent.trim().startsWith('Art.')) {
                       return prev.textContent.trim().split(' ')[1]?.replace('.', '');
                   }
                   prev = prev.previousElementSibling;
                   count++;
               }
           }
           return null;
        };

        elements.forEach(el => {
            const text = el.textContent || '';
            const isChange = text.includes('Redação dada pela Lei') || text.includes('Incluído pela Lei');
            
            if (isChange) {
                // Tenta extrair o ano da Lei (ex: "...de 2021")
                const yearMatch = text.match(/de\s+(\d{4})/);
                if (yearMatch) {
                    const ano = parseInt(yearMatch[1], 10);
                    if (currentYear - ano <= maxAge) {
                        const artNum = findParentArticle(el);
                        if (artNum) {
                            found.push({
                                artigo: `Art. ${artNum}`,
                                motivo: text.trim().replace(/[()]/g, ''),
                                ano: ano
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
