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
                            // Tenta achar um link para a lei
                            let linkLei = "";
                            const aTag = el.tagName === 'A' ? el : el.querySelector('a');
                            if (aTag && aTag.href) {
                                linkLei = aTag.href;
                            } else if (el.parentElement && el.parentElement.tagName === 'A') {
                                linkLei = el.parentElement.href;
                            }

                            found.push({
                                artigo: `Art. ${data.artNum}`,
                                motivo: text.trim().replace(/[()]/g, ''),
                                ano: ano,
                                texto_antigo: data.textoAntigo,
                                texto_novo: data.textoNovo,
                                link_lei: linkLei
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

    // --- DEEP SCRAPE BLOCK ---
    const cacheLeisAcessadas: Record<string, string | null> = {};
    const uncompiledUrl = targetUrl.replace(/compilad[oa]/i, '');
    let uncompiledHtml = "";
    
    // Como o Planalto usa SSL ICP-Brasil, o Fetch no Deno crashea com ECONNRESET / TLS Error.
    // Usaremos a mesma instância do Puppeteer (browser) abrindo UMA ÚNICA ABA extra.
    const pageSec = await browser.newPage();
    await pageSec.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0' });
    
    // 1. Busca a versão HTML não compilada 
    if (uncompiledUrl !== targetUrl) {
       try {
           console.log(`Buscando versão não compilada via Puppeteer: ${uncompiledUrl}`);
           await pageSec.goto(uncompiledUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
           uncompiledHtml = await pageSec.content(); // Salva o HTML sujo inteiro
       } catch (e) {
           console.log("Falha ao buscar HTML da versão não compilada:", e.message);
       }
    }

    const getOldTextFromHtml = (artNum: string, html: string) => {
        const artRegex = new RegExp(`Art\\.\\s*${artNum}\\b[\\s\\S]{0,1500}?<strike>([\\s\\S]*?)</strike>`, 'i');
        const match = html.match(artRegex);
        if (match && match[1]) {
             return match[1].replace(/<[^>]+>/g, '').trim();
        }
        return null;
    };

    // 2. Extrai data completa (apenas URLs únicas para otimização)
    // Extrai URLs únicas e as torna absolutas
    const uniqueLinksMap: Record<string, string> = {};
    updates.forEach(u => {
        if (u.link_lei) {
             let linkFinal = u.link_lei;
             if (linkFinal.startsWith('..') || linkFinal.startsWith('/')) {
                 const baseUrl = new URL(targetUrl);
                 linkFinal = new URL(u.link_lei, baseUrl.href).href;
             }
             if (linkFinal.includes('planalto.gov.br')) {
                 u.link_lei = linkFinal; // Seta de volta
                 uniqueLinksMap[linkFinal] = linkFinal;
             }
        }
    });

    const uniqueLinks = Object.values(uniqueLinksMap);
    console.log(`Deep Scrape em ${uniqueLinks.length} links únicos...`);

    // Visita cada link único apenas UMA vez reutilizando a mesma aba (Super rápido)
    for (const link of uniqueLinks) {
         try {
             await pageSec.goto(link, { waitUntil: 'domcontentloaded', timeout: 15000 });
             const dateData = await pageSec.evaluate(() => {
                   const regexData = /de\s+(\d{1,2})\s+de\s+([a-zçA-Z]+)\s+de\s+(\d{4})/i;
                   let titleMatch = document.title.match(regexData);
                   if (titleMatch) return `${titleMatch[1]} DE ${titleMatch[2].toUpperCase()} DE ${titleMatch[3]}`;
                   
                   const firstText = document.body.innerText.substring(0, 3000);
                   let bodyMatch = firstText.match(regexData);
                   if (bodyMatch) return `${bodyMatch[1]} DE ${bodyMatch[2].toUpperCase()} DE ${bodyMatch[3]}`;
                   
                   return null;
             });
             cacheLeisAcessadas[link] = dateData;
         } catch(e) {
             console.log(`Erro SSL/Timeout ao ler link da lei ${link}:`, e.message);
             cacheLeisAcessadas[link] = null;
         }
    }

    // 3. Mescla tudo de volta no Array
    for (const update of updates) {
       if (!update.texto_antigo && uncompiledHtml) {
           const artNumber = update.artigo.replace(/[^0-9]/g, '');
           if (artNumber) {
               const oldText = getOldTextFromHtml(artNumber, uncompiledHtml);
               if (oldText) update.texto_antigo = oldText;
           }
       }
       if (update.link_lei && cacheLeisAcessadas[update.link_lei]) {
           update.data_completa = cacheLeisAcessadas[update.link_lei];
       }
    }

    // Fecha a aba de scrape
    await pageSec.close();
    // --- FIM DEEP SCRAPE BLOCK ---    await browser.close();

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
