import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || !url.includes('pciconcursos.com.br')) {
      throw new Error('URL inválida');
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao acessar: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse the HTML using Deno DOM
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      throw new Error('Falha ao processar o HTML');
    }

    // Attempt to extract the content. PCI uses <article> or div with id="noticia"
    let contentNode = doc.querySelector('#noticia');
    if (!contentNode) {
      contentNode = doc.querySelector('article');
    }

    if (!contentNode) {
      throw new Error('Não foi possível extrair o conteúdo principal.');
    }

    // Clean up unnecessary elements (ads, sharing buttons, etc)
    const elementsToRemove = contentNode.querySelectorAll('.tags, .compartilhar, .publicidade, script, style, .vejatambem');
    for (const el of elementsToRemove) {
      el.remove();
    }

    // Get the HTML text
    let contentHtml = contentNode.innerHTML;

    // Convert relative links to absolute if needed, or simply return HTML
    
    return new Response(JSON.stringify({ 
      success: true, 
      html: contentHtml,
      text: contentNode.textContent.trim()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
