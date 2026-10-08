import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the areas and cover images from the table. We only need area and capa_livro.
    const { data, error } = await supabaseClient
      .from("biblioteca_estudos")
      .select("area, capa_livro");

    if (error) {
      console.error("Error fetching library data:", error);
      throw new Error("Failed to fetch library data");
    }

    // Group the results
    const map = new Map<string, { name: string; capa?: string; count: number }>();
    
    for (const item of (data || [])) {
      const a = item.area || "Outros";
      const cur = map.get(a);
      if (cur) {
        cur.count++;
      } else {
        map.set(a, { 
          name: a, 
          capa: item.capa_livro || undefined, 
          count: 1 
        });
      }
    }

    const result = Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Exception:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
