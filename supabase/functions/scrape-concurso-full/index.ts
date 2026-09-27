import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, titulo } = await req.json();
    if (!url) throw new Error("URL é obrigatória");

    const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_KEY) throw new Error("FIRECRAWL_API_KEY não configurado.");

    // Firecrawl /scrape retorna markdown limpo do conteúdo da página
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_KEY}`
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 2000
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Firecrawl error:", response.status, errBody);
      throw new Error(`Firecrawl retornou status ${response.status}`);
    }

    const json = await response.json();
    let markdown = json?.data?.markdown || "";

    if (!markdown || markdown.length < 20) {
      throw new Error("Conteúdo extraído muito curto ou vazio.");
    }

    // Cut off everything from 'Compartilhe:' or 'MAPA:' onwards
    const shareIndex = markdown.toLowerCase().indexOf('compartilhe:');
    if (shareIndex !== -1) {
      markdown = markdown.substring(0, shareIndex);
    }
    const mapIndex = markdown.toLowerCase().indexOf('mapa:');
    if (mapIndex !== -1) {
      markdown = markdown.substring(0, mapIndex);
    }

    // Strip everything before the title (if provided and found)
    if (titulo) {
      // Escape regex chars but allow whitespace differences
      const safeTitle = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const titleRegex = new RegExp(safeTitle, 'i');
      const titleMatch = markdown.match(titleRegex);
      if (titleMatch && titleMatch.index !== undefined) {
        markdown = markdown.substring(titleMatch.index);
      }
    }

    // Clean up PCI Concursos specific generic headers, footers, and logo images
    markdown = markdown
      // Remove generic login/search headers
      .replace(/^(Entrar com Google|Pesquisar)\s*\n+/gmi, '')
      // Remove regional navigation
      .replace(/- \[(Nacional|Sudeste|Sul|Centro-Oeste|Norte|Nordeste)\].*?\n/gi, '')
      // Remove PCI logos and headers
      .replace(/\[!\[\]\(https:\/\/www\.pciconcursos\.com\.br\/img\/.*?\)\].*?\n/g, '')
      .replace(/\[!\[\]\(.*?\)\].*?\n/g, '')
      // Remove navigation links like [Página Inicial](...)
      .replace(/- \[(Página Inicial|Apostilas|Provas|Videoaulas|Aulas em Áudio|Dicas|Questões|Gabaritos)\].*?\n/gi, '')
      // Remove more generic links if they are alone
      .replace(/^\[.*?\]\(.*?\)$/gm, '')
      .replace(/Busca.*?Apostilas.*?/gi, '')
      // Reduce multiple line breaks to maximum two
      .replace(/\n{3,}/g, '\n\n')
      .replace(/ {2,}/g, ' ')
      .trim();

    return new Response(JSON.stringify({ text: markdown }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const err = error as Error;
    console.error("Erro no scrape-concurso-full:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
