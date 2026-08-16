// supabase/functions/boletim-cron-deploy/index.ts
// Edge Function que atualiza os agendamentos pg_cron dos boletins
// a partir dos horários configurados no Admin.
//
// Recebe: { juridico_cron: "12:00:00", noticias_cron: "22:30:00" }
// Ação: chama a RPC `admin_deploy_boletim_crons` que faz
//       cron.unschedule + cron.schedule com os novos horários.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { juridico_cron, noticias_cron } = await req.json();

    if (!juridico_cron && !noticias_cron) {
      return new Response(
        JSON.stringify({ error: "Nenhum horário informado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Converte horário "HH:MM:SS" para expressão cron "M H * * *"
    const toCron = (time: string, daysOfWeek = "*"): string => {
      const [h, m] = time.split(":");
      return `${parseInt(m, 10)} ${parseInt(h, 10)} * * ${daysOfWeek}`;
    };

    // Monta os crons para deploy
    const crons: { name: string; schedule: string; function_name: string; body: string }[] = [];

    if (juridico_cron) {
      crons.push({
        name: "boletim-juridico-diario",
        schedule: toCron(juridico_cron),
        function_name: "boletim-juridico-gerar",
        body: JSON.stringify({ triggeredBy: "cron" }),
      });
    }

    if (noticias_cron) {
      crons.push({
        name: "boletim-noticias-diario",
        schedule: toCron(noticias_cron),
        function_name: "boletim-noticias-gerar",
        body: JSON.stringify({ triggeredBy: "cron" }),
      });
    }

    // Chama a RPC segura que executa cron.unschedule + cron.schedule
    const { data, error } = await supabase.rpc("admin_deploy_boletim_crons", {
      crons_json: JSON.stringify(crons),
      anon_key: ANON_KEY,
    });

    if (error) {
      console.error("RPC error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, deployed: crons.map((c) => c.name), detail: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("boletim-cron-deploy error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
