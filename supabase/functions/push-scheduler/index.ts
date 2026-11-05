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
    const now = new Date();
    // Ajuste para fuso horário de Brasília (UTC-3)
    now.setHours(now.getHours() - 3);
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${currentHour}:${currentMinute}:00`;

    console.log(`Verificando schedules para dow=${dayOfWeek} e time=${timeString}`);

    // Busca agendamentos normais
    const { data: schedulesNormal, error: errNormal } = await supabase
      .from('push_schedules_normal')
      .select('*, push_templates_normal(*)')
      .eq('is_active', true)
      .eq('time_of_day', timeString)
      .contains('days_of_week', [dayOfWeek]);

    if (errNormal) throw errNormal;

    // Busca agendamentos assinatura
    const { data: schedulesAssinatura, error: errAssinatura } = await supabase
      .from('push_schedules_assinatura')
      .select('*, push_templates_assinatura(*)')
      .eq('is_active', true)
      .eq('time_of_day', timeString)
      .contains('days_of_week', [dayOfWeek]);

    if (errAssinatura) throw errAssinatura;

    const allSchedules = [
      ...(schedulesNormal || []).map(s => ({ ...s, template: s.push_templates_normal, audience: { all: true } })),
      ...(schedulesAssinatura || []).map(s => ({ ...s, template: s.push_templates_assinatura, audience: { premium: "free" } }))
    ];

    if (allSchedules.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum disparo agendado para este horário" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dispatched = [];

    for (const schedule of allSchedules) {
      if (!schedule.template) continue;

      // 1. Cria a campanha no histórico
      const { data: campaign, error: cErr } = await supabase.from('push_campaigns').insert({
        title: schedule.template.name,
        body: schedule.template.description,
        status: 'sending',
        tipo: 'automatizado'
      }).select().single();

      if (cErr) {
        console.error("Erro ao criar campanha", cErr);
        continue;
      }

      // 2. Busca os tokens do audience (incluindo administradores)
      let q = supabase.from("device_tokens")
        .select("token,user_id,platform")
        .is("invalidated_at", null);
      if (schedule.audience.premium === "free") {
        const { data: pf } = await supabase.from("profiles").select("id").eq("is_premium", false);
        const freeIds = (pf || []).map((p: any) => p.id);
        q = q.in("user_id", freeIds.length ? freeIds : ["00000000-0000-0000-0000-000000000000"]);
      }
      
      const { data: tokens, error: tErr } = await q.limit(50000);
      if (tErr || !tokens || tokens.length === 0) {
        await supabase.from("push_campaigns").update({ status: 'completed' }).eq('id', campaign.id);
        continue;
      }

      // 3. Divide em chunks de 500 e manda para send-push
      const CHUNK_SIZE = 500;
      const selfUrl = `${supabaseUrl}/functions/v1/send-push`;
      const chunkPromises = [];

      for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
        const chunk = tokens.slice(i, i + CHUNK_SIZE);
        chunkPromises.push(
          fetch(selfUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              campaign_id: campaign.id,
              title: schedule.template.name,
              body: schedule.template.description,
              emoji: schedule.template.emoji,
              is_worker: true,
              worker_rows: chunk
            }),
          })
        );
      }

      await Promise.all(chunkPromises);
      dispatched.push({ template: schedule.template.name, chunks: chunkPromises.length });
    }

    return new Response(JSON.stringify({ message: "Agendamentos processados", dispatched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
