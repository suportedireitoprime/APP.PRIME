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
    const { url } = await req.json();
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
    const markdown = json?.data?.markdown || "";

    if (!markdown || markdown.length < 20) {
      throw new Error("Conteúdo extraído muito curto ou vazio.");
    }

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
