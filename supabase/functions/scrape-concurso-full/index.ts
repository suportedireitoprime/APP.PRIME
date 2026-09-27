import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, titulo, id } = await req.json();
    if (!url && !id) throw new Error("URL ou ID é obrigatório");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let supabaseClient = null;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    }

    // 1. Checar se já existe no Supabase persistido
    if (supabaseClient) {
      let query = supabaseClient.from("concursos_noticias").select("id, conteudo_md, link, titulo");
      if (id) {
        query = query.eq("id", id);
      } else if (url) {
        query = query.eq("link", url);
      }

      const { data: existingRow } = await query.maybeSingle();
      if (existingRow && existingRow.conteudo_md && existingRow.conteudo_md.trim().length > 20) {
        console.log(`[scrape-concurso-full] Retornando cache do Supabase para: ${id || url}`);
        return new Response(JSON.stringify({ text: existingRow.conteudo_md, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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
      const safeTitle = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const titleRegex = new RegExp(safeTitle, 'i');
      const titleMatch = markdown.match(titleRegex);
      if (titleMatch && titleMatch.index !== undefined) {
        markdown = markdown.substring(titleMatch.index);
      }
    }

    // Clean up PCI Concursos specific generic headers, footers, and logo images
    markdown = markdown
      .replace(/^(Entrar com Google|Pesquisar)\s*\n+/gmi, '')
      .replace(/- \[(Nacional|Sudeste|Sul|Centro-Oeste|Norte|Nordeste)\].*?\n/gi, '')
      .replace(/\[!\[\]\(https:\/\/www\.pciconcursos\.com\.br\/img\/.*?\)\].*?\n/g, '')
      .replace(/\[!\[\]\(.*?\)\].*?\n/g, '')
      .replace(/- \[(Página Inicial|Apostilas|Provas|Videoaulas|Aulas em Áudio|Dicas|Questões|Gabaritos)\].*?\n/gi, '')
      .replace(/^\[.*?\]\(.*?\)$/gm, '')
      .replace(/Busca.*?Apostilas.*?/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/ {2,}/g, ' ')
      .trim();

    // 2. Persistir no Supabase para nunca mais precisar reextrair
    if (supabaseClient && markdown && markdown.length > 20) {
      try {
        let updateQuery = supabaseClient.from("concursos_noticias").update({ conteudo_md: markdown });
        if (id) {
          updateQuery = updateQuery.eq("id", id);
        } else if (url) {
          updateQuery = updateQuery.eq("link", url);
        }
        const { error: updateErr } = await updateQuery;
        if (updateErr) {
          console.error("[scrape-concurso-full] Erro ao persistir conteudo_md no Supabase:", updateErr.message);
        } else {
          console.log(`[scrape-concurso-full] Conteúdo persistido com sucesso no Supabase para ${id || url}`);
        }
      } catch (persistErr) {
        console.error("[scrape-concurso-full] Exceção ao persistir no Supabase:", persistErr);
      }
    }

    return new Response(JSON.stringify({ text: markdown, cached: false }), {
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
