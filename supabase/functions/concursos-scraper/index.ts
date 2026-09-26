import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req: Request) => {
  try {
    console.log("Iniciando raspagem de concursos (PCI Concursos)...");

    // 1. Fazer fetch da página de notícias
    const response = await fetch("https://www.pciconcursos.com.br/noticias/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    console.log("Fetch Status:", response.status, "HTML bytes:", html.length);
    const $ = cheerio.load(html);

    const concursos: { titulo: string; link: string; resumo: string; imagem_url: string | null }[] = [];

    // PCI Concursos geralmente lista em <ul class="noticias link-d">
    $('ul.noticias.link-d > li > a').each((_, element) => {
      const link = $(element).attr('href');
      const titulo = $(element).attr('title') || $(element).text().trim();
      
      // Checar se o link é uma notícia válida e tem um título razoável
      if (link && link.includes('/noticias/') && titulo.length > 10) {
        // Encontrar o resumo, que normalmente é o próximo elemento span ou texto depois
        let resumo = '';
        const parentLi = $(element).closest('li');
        if (parentLi.length) {
           const textContent = parentLi.text().trim();
           // Remove o titulo do texto completo para pegar o resumo
           resumo = textContent.replace(titulo, '').trim().substring(0, 150);
        } else {
           const nextSpan = $(element).nextAll('span').first();
           if (nextSpan.length) resumo = nextSpan.text().trim().substring(0, 150);
        }

        const imgTag = $(element).find('img.lazyload');
        const imagem_url = imgTag.length > 0 ? (imgTag.attr('data-src') || null) : null;

        concursos.push({
          titulo,
          link: link.startsWith('http') ? link : `https://www.pciconcursos.com.br${link}`,
          resumo: resumo || 'Notícia sobre concurso público.',
          imagem_url,
        });
      }
    });

    // Se a primeira estratégia não pegar muito, vamos ser mais amplos
    if (concursos.length < 5) {
      $('a').each((_, element) => {
        const link = $(element).attr('href');
        const titulo = $(element).text().trim();
        const parentText = $(element).parent().text().trim();
        let resumo = parentText.replace(titulo, '').trim().substring(0, 150);
        
        const imgTag = $(element).find('img.lazyload');
        const imagem_url = imgTag.length > 0 ? (imgTag.attr('data-src') || null) : null;

        if (link && link.includes('/noticias/') && titulo.length > 20 && titulo.includes('Vagas')) {
          concursos.push({
            titulo,
            link: link.startsWith('http') ? link : `https://www.pciconcursos.com.br${link}`,
            resumo: resumo || 'Nova oportunidade.',
            imagem_url,
          });
        }
      });
    }

    // Desduplicar por link
    const uniqueMap = new Map();
    for (const c of concursos) {
      if (!uniqueMap.has(c.link)) {
        uniqueMap.set(c.link, c);
      }
    }
    const uniqueConcursos = Array.from(uniqueMap.values()).slice(0, 30); // Limitar a 30

    console.log(`Encontrados ${uniqueConcursos.length} concursos.`);

    // 2. Salvar no Supabase
    let countInserted = 0;
    const errorsList = [];
    for (const concurso of uniqueConcursos) {
      const { error } = await supabase
        .from("concursos_noticias")
        .upsert(
          {
            titulo: concurso.titulo,
            link: concurso.link,
            resumo: concurso.resumo,
          },
          { onConflict: "link" }
        );

      if (error) {
        console.error(`Erro ao salvar concurso ${concurso.link}:`, error.message);
        errorsList.push(error.message);
      } else {
        countInserted++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${countInserted} concursos processados e atualizados.`,
        data: uniqueConcursos,
        debug: { fetchStatus: response.status, keyPrefix: supabaseKey.substring(0, 10), errors: errorsList }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Erro geral no scraper de concursos:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
