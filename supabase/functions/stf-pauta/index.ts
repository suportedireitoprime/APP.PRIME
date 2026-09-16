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
    const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const targetUrl = 'https://portal.stf.jus.br/sessoes/';
    let htmlContent = '';
    let successSource = '';

    try {
      if (FIRECRAWL_API_KEY) {
        console.log('Tentando via Firecrawl...');
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
          },
          body: JSON.stringify({ url: targetUrl, formats: ['html'] })
        });
        
        const data = await response.json();
        if (response.ok && data.success && data.data.html && !data.data.html.includes('403 Forbidden')) {
          htmlContent = data.data.html;
          successSource = 'Firecrawl';
        } else {
          console.log('Firecrawl falhou ou foi bloqueado:', data);
        }
      }

      if (!htmlContent && BROWSERLESS_API_KEY) {
        console.log('Tentando via Browserless...');
        const response = await fetch(`https://chrome.browserless.io/content?token=${BROWSERLESS_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, gotoOptions: { waitUntil: 'networkidle2' } })
        });
        
        if (response.ok) {
          const text = await response.text();
          if (!text.includes('403 Forbidden')) {
            htmlContent = text;
            successSource = 'Browserless';
          } else {
            console.log('Browserless bloqueado com 403 Forbidden');
          }
        }
      }

      if (!htmlContent) {
        console.log('Tentando fetch nativo (Fallback)...');
        const response = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (response.ok) {
          const text = await response.text();
          if (!text.includes('403 Forbidden')) {
            htmlContent = text;
            successSource = 'Nativo';
          }
        }
      }
    } catch (fetchErr) {
      console.log('Erro de rede na extração:', fetchErr.message);
    }

    const $ = cheerio.load(htmlContent);
    const pauta = [];

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

    if (pauta.length === 0) {
      pauta.push(
        {
          id: "1",
          titulo: "ADI 0000",
          relator: "MINISTRO LUIZ FUX",
          resumo: "Pauta indisponível. Motivo: STF WAF bloqueou todos os métodos (Firecrawl, Browserless e Nativo).",
          data: new Date().toISOString(),
          orgao: "STF"
        },
        {
          id: "2",
          titulo: "RE 123456",
          relator: "INFO SISTEMA",
          resumo: "A chave do Firecrawl atual está inválida. Verifique o Supabase Secrets.",
          data: new Date().toISOString(),
          orgao: "STF"
        }
      );
    }

    return new Response(JSON.stringify(pauta), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
