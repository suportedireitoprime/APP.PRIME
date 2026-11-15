// Edge Function: push-scheduler (Compatibilidade & Redirecionamento Seguro)
// Encaminha requisições legadas diretamente para o despachante unificado push-dispatcher.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Encaminha a execução para o dispatcher unificado focado em campanhas agendadas
    const { data, error } = await supabase.functions.invoke("push-dispatcher", {
      body: { action: "campaigns" },
    });

    if (error) {
      console.error("[push-scheduler -> push-dispatcher error]:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      message: "Encaminhado com sucesso para push-dispatcher", 
      result: data 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[push-scheduler fatal]:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
