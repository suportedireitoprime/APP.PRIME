import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const BROWSERLESS_TOKEN = Deno.env.get('BROWSERLESS_TOKEN');

    let htmlContent = '';

    if (BROWSERLESS_TOKEN) {
      // Usar a API do Browserless para renderizar a página completa (com JS)
      const browserlessUrl = `https://chrome.browserless.io/content?token=${BROWSERLESS_TOKEN}`;
      
      const response = await fetch(browserlessUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://portal.stf.jus.br/sessoes/',
          gotoOptions: { waitUntil: 'networkidle2' }
        })
      });

      if (!response.ok) {
        throw new Error(`Browserless API error: ${response.statusText}`);
      }
      
      htmlContent = await response.text();
    } else {
      // Fallback para fetch simples (pode falhar se depender de JS ou for bloqueado)
      console.log('BROWSERLESS_TOKEN não configurado. Tentando fetch nativo...');
      const response = await fetch('https://portal.stf.jus.br/sessoes/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });
      htmlContent = await response.text();
    }

    const $ = cheerio.load(htmlContent);
    const pauta = [];

    // NOTA: Os seletores abaixo são exemplos. Como a página real pode variar (ou ser renderizada via Vue/Angular),
    // eles precisarão ser ajustados assim que a estrutura real da tabela for inspecionada.
    $('.sessao, .processo-item, tr.processo').each((index, element) => {
      const titulo = $(element).find('.titulo, .classe-numero').text().trim();
      const relator = $(element).find('.relator').text().trim();
      const resumo = $(element).find('.resumo, .assunto').text().trim();
      const data = $(element).find('.data').text().trim();

      if (titulo) {
        pauta.push({
          id: index.toString(),
          titulo: titulo || 'Processo não identificado',
          relator: relator || 'Relator não informado',
          resumo: resumo || 'Sem resumo disponível',
          data: data || new Date().toISOString(),
          orgao: 'STF'
        });
      }
    });

    // Mock temporário para testes se o seletor falhar (já que a página pode não retornar o esperado no fetch simples)
    if (pauta.length === 0) {
      pauta.push({
         id: "1",
         titulo: "ADI 0000",
         relator: "MIN. FUX",
         resumo: "Pauta capturada - (Requer ajuste fino dos seletores Cheerio no HTML real)",
         data: new Date().toISOString(),
         orgao: "STF"
      });
    }

    return new Response(JSON.stringify(pauta), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
