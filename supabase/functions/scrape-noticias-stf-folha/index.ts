import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JotaNews {
  titulo: string;
  resumo: string;
  url: string;
  data_publicacao: string;
  imagem_url: string | null;
}

async function scrapeJotaSTF(): Promise<string | null> {
  const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY");
  if (!browserlessKey) {
    throw new Error("BROWSERLESS_API_KEY is not configured.");
  }
  
  const url = "https://www.jota.info/tudo-sobre/stf";
  console.log(`Buscando ${url} via Browserless...`);
  
  // Try /content first
  let endpoint = `https://production-sfo.browserless.io/content?token=${browserlessKey}`;
  let resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      waitForTimeout: 5000,
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
        waitForTimeout: 10000,
      }),
    });
    
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && data.content) return data.content;
    }
    
    throw new Error(`Falha no scraping via Browserless. Status: ${resp.status}`);
  }
}

function parseJSON(html: string): JotaNews[] {
  const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!jsonMatch) {
    console.error("Não foi possível encontrar __NEXT_DATA__ no HTML retornado.");
    return [];
  }
  
  try {
    const data = JSON.parse(jsonMatch[1]);
    const posts = data?.props?.pageProps?.posts || [];
    
    return posts.map((post: any) => ({
      titulo: post.title,
      resumo: post.hat || "Supremo Tribunal Federal", // Jota's 'hat' (chapéu) acts as a short category/summary
      url: "https://www.jota.info" + post.permalink,
      imagem_url: post.imagem || null,
      data_publicacao: new Date().toISOString() 
    }));
  } catch (e) {
    console.error("Erro ao fazer parse do JSON do Jota", e);
    return [];
  }
}

function htmlToMarkdown(html: string): string {
  let out = html;
  out = out.replace(/<(script|style|iframe|ins|noscript)[\s\S]*?<\/\1>/gi, '');
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  out = out.replace(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi, (_m, c) => `\n\n**${c.replace(/<[^>]+>/g, '').trim()}**\n\n`);
  out = out.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, c) => `\n\n> ${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  out = out.replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, (_m, src) => `\n\n![](${src})\n\n`);
  out = out.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, txt) => `[${txt.replace(/<[^>]+>/g, '').trim()}](${href})`);
  out = out.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => `**${c.replace(/<[^>]+>/g, '').trim()}**`);
  out = out.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => `*${c.replace(/<[^>]+>/g, '').trim()}*`);
  out = out.replace(/<br\s*\/?>/gi, '\n\n');
  out = out.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, c) => `\n\n${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  out = out.replace(/<\/(div|section|article|li)>/gi, '\n\n');
  out = out.replace(/<[^>]+>/g, '');
  out = out.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

async function fetchArticleFullText(url: string, browserlessKey: string): Promise<string | null> {
  try {
    const endpoint = `https://production-sfo.browserless.io/content?token=${browserlessKey}`;
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, waitForTimeout: 3000 }),
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    
    // Tentamos extrair via __NEXT_DATA__
    const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[1]);
      if (data?.props?.pageProps?.post?.content) {
        return htmlToMarkdown(data.props.pageProps.post.content);
      }
    }
    
    // Fallback: extrair o div com o conteúdo da matéria
    const contentMatch = html.match(/class="[^"]*jota-article-content[^"]*"[^>]*>([\s\S]*?)(?:<\/article>|<div[^>]*class="[^"]*jota-tags)/i);
    if (contentMatch) {
      return htmlToMarkdown(contentMatch[1]);
    }
    
    return null;
  } catch (e) {
    console.error(`Erro ao buscar conteúdo completo de ${url}:`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const html = await scrapeJotaSTF();
    if (!html) {
      throw new Error("Nenhum HTML retornado pelo Browserless.");
    }
    
    let extractedNews = parseJSON(html);
    console.log(`Extraídas ${extractedNews.length} notícias únicas.`);
    
    let novosCount = 0;
    
    if (extractedNews.length > 0) {
      // 1. Pegar quais já existem no banco
      const urls = extractedNews.map(n => n.url);
      const { data: existingData } = await supabase
        .from('stf_noticias_folha')
        .select('url')
        .in('url', urls);
        
      const existingUrls = new Set((existingData || []).map(row => row.url));
      
      // 2. Filtrar apenas as novas
      const newArticles = extractedNews.filter(n => !existingUrls.has(n.url));
      console.log(`${newArticles.length} artigos são novos e serão enriquecidos.`);
      
      // 3. Enriquecer (buscar texto completo)
      const browserlessKey = Deno.env.get("BROWSERLESS_API_KEY")!;
      for (const article of newArticles) {
        console.log(`Buscando texto completo para: ${article.titulo}`);
        const fullMarkdown = await fetchArticleFullText(article.url, browserlessKey);
        
        // Corrige imagem para remover o sufixo -230x230
        if (article.imagem_url) {
          article.imagem_url = article.imagem_url.replace(/-\d+x\d+\.jpg$/i, '.jpg');
        }
        
        if (fullMarkdown && fullMarkdown.length > 100) {
          // Salva o Markdown completo no campo 'resumo', preservando a categoria (hat) no topo.
          article.resumo = `CATEGORIA: ${article.resumo}\n\n${fullMarkdown}`;
        }
      }
      
      // 4. Salvar apenas os novos artigos no banco
      if (newArticles.length > 0) {
        const { data, error } = await supabase
          .from('stf_noticias_folha')
          .upsert(
            newArticles.map(news => ({
              titulo: news.titulo,
              resumo: news.resumo,
              url: news.url,
              imagem_url: news.imagem_url,
              data_publicacao: news.data_publicacao
            })),
            { onConflict: 'url', ignoreDuplicates: false }
          )
          .select('id');
          
        if (error) {
          throw error;
        }
        novosCount = data ? data.length : 0;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${extractedNews.length} extraídas, ${novosCount} novas inseridas com texto completo do JOTA.` 
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
