import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FolhaNews {
  titulo: string;
  resumo: string;
  url: string;
  data_publicacao: string;
}

// Helper to convert Folha date formats into ISO timestamp
// Ex: "28.ago.2026 às 10h30" or ISO format from <time> tag
function parseFolhaDate(dateStr: string): string | null {
  try {
    // If it's already an ISO or valid datetime format
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function scrapeFolhaSTF(): Promise<string | null> {
  const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
  if (!browserlessKey) {
    throw new Error("BROWSERLESS_API_KEY is not configured.");
  }
  
  const url = "https://www1.folha.uol.com.br/poder/stf/";
  console.log(`Buscando ${url} via Browserless...`);
  
  // Try /content first
  let endpoint = `https://production-sfo.browserless.io/content?token=${browserlessKey}`;
  let resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      waitForTimeout: 10000,
    }),
  });
  
  if (resp.ok) {
    return await resp.text();
  } else {
    console.log("Falha no /content, tentando /unblock...");
    endpoint = `https://production-sfo.browserless.io/unblock?token=${browserlessKey}`;
    resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        content: true,
        waitForTimeout: 15000,
      }),
    });
    
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.content) return data.content;
    }
    
    throw new Error(`Falha no scraping via Browserless. Status: ${resp.status}`);
  }
}

function parseHTML(html: string): FolhaNews[] {
  const newsList: FolhaNews[] = [];
  
  // Regex para encontrar links de notícias
  // As notícias da Folha geralmente tem <h2 class="c-news__title"> e <p class="c-news__desc">
  // Envelopados em links <a> ou blocos <li class="c-headline__item">
  
  // Regex genérica para buscar blocos que contenham href, título e resumo
  // Procuramos <a> tags que apontem para folha.uol.com.br/poder/...
  const anchorRegex = /<a[^>]*href="([^"]+folha\.uol\.com\.br\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const url = match[1];
    const innerHtml = match[2];
    
    // Check if it's a valid news URL (skip generic links, tags, etc)
    if (!url.includes(".shtml")) continue;
    
    // Extract title (usually inside <h2> or <h3>)
    const titleMatch = innerHtml.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
    if (!titleMatch) continue;
    let titulo = titleMatch[1].replace(/<[^>]+>/g, "").trim();
    
    // Extract summary (usually inside <p>)
    const summaryMatch = innerHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    let resumo = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    
    if (titulo.length > 5) {
      // Decode HTML entities
      titulo = titulo.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
      resumo = resumo.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
      
      newsList.push({
        titulo,
        resumo,
        url,
        data_publicacao: new Date().toISOString() // Fallback to current time if we can't parse
      });
    }
  }
  
  // Filter unique URLs
  const uniqueNews = Array.from(new Map(newsList.map(item => [item.url, item])).values());
  return uniqueNews;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const html = await scrapeFolhaSTF();
    if (!html) {
      throw new Error("Nenhum HTML retornado pelo Browserless.");
    }
    
    const extractedNews = parseHTML(html);
    console.log(`Extraídas ${extractedNews.length} notícias únicas.`);
    
    let novosCount = 0;
    
    if (extractedNews.length > 0) {
      // Usar a URL para evitar duplicatas (upsert ignora inserção de mesmos valores se houver política ignore)
      // Como a tabela define 'url' como UNIQUE, fazemos um upsert
      const { data, error } = await supabase
        .from('stf_noticias_folha')
        .upsert(
          extractedNews.map(news => ({
            titulo: news.titulo,
            resumo: news.resumo,
            url: news.url,
            data_publicacao: news.data_publicacao
          })),
          { onConflict: 'url', ignoreDuplicates: true }
        )
        .select('id');
        
      if (error) {
        throw error;
      }
      
      novosCount = data ? data.length : 0;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${extractedNews.length} extraídas, ${novosCount} novas inseridas.` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Erro no scraper de notícias do STF:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
