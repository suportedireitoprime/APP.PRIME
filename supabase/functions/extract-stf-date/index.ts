import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as pdfjsLib from "npm:pdfjs-dist@3.11.174";
// Necessario para node/deno
// import "npm:pdfjs-dist@3.11.174/build/pdf.worker.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  try {
    const { pdf_url } = await req.json();
    if (!pdf_url) return new Response(JSON.stringify({ error: "pdf_url is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    console.log("Fetching", pdf_url);
    const res = await fetch(pdf_url, {
       headers: {
         "User-Agent": "Mozilla/5.0",
         "Accept": "application/pdf"
       }
    });
    
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch PDF: ${res.status}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Check if HTML
    if (bytes.length > 0 && bytes[0] === 60) {
      return new Response(JSON.stringify({ error: "Received HTML instead of PDF" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const doc = await pdfjsLib.getDocument({ data: bytes, useSystemFonts: true }).promise;
    let text = "";
    for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
       const page = await doc.getPage(i);
       const content = await page.getTextContent();
       text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    
    // Simple regex for date
    const regex = /(\d{1,2})\s*de\s*(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*de\s*(\d{4})/i;
    const match = text.match(regex);
    let date = null;
    if (match) {
       date = `${match[1]} de ${match[2]} de ${match[3]}`;
    }
    
    return new Response(JSON.stringify({ date, text: text.substring(0, 1000) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
