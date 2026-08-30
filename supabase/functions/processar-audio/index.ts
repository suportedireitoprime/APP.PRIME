import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const githubToken = Deno.env.get("GITHUB_PAT_TOKEN");

    if (!githubToken) {
      console.error("GITHUB_PAT_TOKEN não configurado nos secrets do Supabase");
      return new Response(JSON.stringify({ error: "Configuração do servidor incompleta (GITHUB_PAT_TOKEN)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { raw_audio_url, record_id, table_name, bucket_name, final_file_path, intro_url } = body;

    if (!raw_audio_url || !record_id || !table_name || !bucket_name || !final_file_path) {
      return new Response(JSON.stringify({ error: "Parâmetros incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Disparando GitHub Action para record_id: ${record_id}`);

    // Call GitHub API to trigger repository_dispatch
    const githubResponse = await fetch("https://api.github.com/repos/suportedireitoprime/APP.PRIME/dispatches", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_type: "process_audio",
        client_payload: {
          supabase_url: supabaseUrl,
          supabase_key: supabaseServiceKey,
          raw_audio_url,
          record_id,
          table_name,
          bucket_name,
          final_file_path,
          intro_url: intro_url || "none"
        }
      })
    });

    if (!githubResponse.ok) {
      const errText = await githubResponse.text();
      console.error("Falha ao disparar GitHub Action:", errText);
      return new Response(JSON.stringify({ error: "Falha ao iniciar processamento na nuvem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Processamento na nuvem iniciado" }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
