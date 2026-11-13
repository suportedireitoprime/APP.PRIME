// Edge Function: push-dispatcher
// Unifica o agendamento e despacho de notificações periódicas (Campanhas, Lembretes e Trials),
// substituindo múltiplos cron jobs de 1 minuto por um despachante único e eficiente.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DispatcherRequest {
  action?: "all" | "campaigns" | "reminders" | "trials" | "blog";
  actions?: Array<"campaigns" | "reminders" | "trials" | "blog">;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let body: DispatcherRequest = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    body = {};
  }

  const actionsToRun = new Set<string>();
  if (body.action === "all" || (!body.action && (!body.actions || body.actions.length === 0))) {
    actionsToRun.add("campaigns");
    actionsToRun.add("reminders");
    actionsToRun.add("trials");
  } else if (body.action) {
    actionsToRun.add(body.action);
  }

  if (Array.isArray(body.actions)) {
    for (const a of body.actions) actionsToRun.add(a);
  }

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    executed_actions: Array.from(actionsToRun),
  };

  try {
    // 1. Processa Campanhas Agendadas (push_campaigns)
    if (actionsToRun.has("campaigns")) {
      const nowIso = new Date().toISOString();
      const { data: scheduledCampaigns, error: campErr } = await supabase
        .from("push_campaigns")
        .select("*")
        .eq("status", "scheduled")
        .lte("next_run_at", nowIso)
        .limit(20);

      if (campErr) {
        console.error("[push-dispatcher] Erro ao buscar campanhas:", campErr);
        results.campaigns = { error: campErr.message };
      } else {
        const processed = [];
        for (const camp of scheduledCampaigns || []) {
          try {
            await supabase
              .from("push_campaigns")
              .update({ status: "sending", last_run_at: nowIso })
              .eq("id", camp.id);

            await supabase.functions.invoke("send-push", {
              body: {
                campaign_id: camp.id,
                title: camp.title,
                body: camp.body,
                url: camp.url || camp.click_url || "/inbox",
                icon: camp.icon,
                image: camp.image_url,
                emoji: camp.emoji,
                audience: camp.audience || { all: true, target: "all", include_admins: true },
                data: {
                  campaign_id: camp.id,
                  automation_key: camp.automation_key || "scheduled_dispatch",
                },
              },
            });

            await supabase
              .from("push_campaigns")
              .update({ status: "completed" })
              .eq("id", camp.id);

            processed.push({ id: camp.id, title: camp.title, status: "completed" });
          } catch (cErr: any) {
            console.error(`[push-dispatcher] Erro ao processar campanha ${camp.id}:`, cErr);
            processed.push({ id: camp.id, error: cErr.message });
          }
        }
        results.campaigns = { found: scheduledCampaigns?.length || 0, processed };
      }
    }

    // 2. Processa Lembretes de Leitura / Artigos (reminders-tick)
    if (actionsToRun.has("reminders")) {
      try {
        const { data: remData, error: remErr } = await supabase.functions.invoke("reminders-tick");
        results.reminders = remErr ? { error: remErr.message } : remData || { status: "dispatched" };
      } catch (remEx: any) {
        console.error("[push-dispatcher] Erro ao invocar reminders-tick:", remEx);
        results.reminders = { error: remEx.message };
      }
    }

    // 3. Processa Lembretes de Trial (6h e expirado de forma segura e idempotente)
    if (actionsToRun.has("trials")) {
      try {
        const now = new Date();
        const h66 = new Date(now.getTime() - 72 * 3600 * 1000).toISOString();
        const h72 = new Date(now.getTime() - 66 * 3600 * 1000).toISOString();
        const h96 = new Date(now.getTime() - 96 * 3600 * 1000).toISOString();

        // Usuários criados entre 66h e 72h atrás (faltando até 6h pro trial)
        const { data: users6h } = await supabase
          .from("profiles")
          .select("id, created_at, is_premium")
          .gte("created_at", h66)
          .lte("created_at", h72)
          .or("is_premium.is.null,is_premium.eq.false")
          .limit(50);

        let sent6h = 0;
        for (const u of users6h || []) {
          const { data: alreadySent } = await supabase
            .from("trial_notifications_sent")
            .select("id")
            .eq("user_id", u.id)
            .eq("notification_type", "trial_6h_remaining")
            .maybeSingle();

          if (!alreadySent) {
            await supabase.functions.invoke("send-push", {
              body: {
                title: "⚡ Restam 6 horas da sua degustação!",
                body: "Seu acesso VIP de 3 dias termina hoje! Garanta o plano Vitalício por R$ 149,90 ou Anual por R$ 89,90 com até 62% OFF antes do encerramento.",
                url: "/assinatura",
                audience: { user_ids: [u.id] },
                mirror_canal: false,
                personalize: true,
                data: { automation_key: "trial_6h_remaining" },
              },
            });

            await supabase.from("trial_notifications_sent").insert({
              user_id: u.id,
              notification_type: "trial_6h_remaining",
              status: "sent",
              metadata: { created_at: u.created_at },
            });
            sent6h++;
          }
        }

        // Usuários criados entre 72h e 96h atrás (trial recém-expirado)
        const { data: usersExpired } = await supabase
          .from("profiles")
          .select("id, created_at, is_premium")
          .gte("created_at", h96)
          .lt("created_at", h66)
          .or("is_premium.is.null,is_premium.eq.false")
          .limit(50);

        let sentExpired = 0;
        for (const u of usersExpired || []) {
          const { data: alreadySent } = await supabase
            .from("trial_notifications_sent")
            .select("id")
            .eq("user_id", u.id)
            .eq("notification_type", "trial_expired")
            .maybeSingle();

          if (!alreadySent) {
            await supabase.functions.invoke("send-push", {
              body: {
                title: "🔒 Teste de 3 dias encerrado",
                body: "Sua degustação gratuita acabou. Desbloqueie todo o acervo e IA sem limites a partir de R$ 29,90/mês ou R$ 149,90 vitalício!",
                url: "/assinatura",
                audience: { user_ids: [u.id] },
                mirror_canal: false,
                personalize: true,
                data: { automation_key: "trial_expired" },
              },
            });

            await supabase.from("trial_notifications_sent").insert({
              user_id: u.id,
              notification_type: "trial_expired",
              status: "sent",
              metadata: { created_at: u.created_at },
            });
            sentExpired++;
          }
        }

        results.trials = { checked_6h: users6h?.length || 0, sent_6h: sent6h, checked_expired: usersExpired?.length || 0, sent_expired: sentExpired };
      } catch (trialEx: any) {
        console.error("[push-dispatcher] Erro ao processar trials:", trialEx);
        results.trials = { error: trialEx.message };
      }
    }

    // 4. Processa Post do Blog (se explicitamente solicitado)
    if (actionsToRun.has("blog")) {
      try {
        const { data: blogData, error: blogErr } = await supabase.functions.invoke("blog-push-slot");
        results.blog = blogErr ? { error: blogErr.message } : blogData || { status: "dispatched" };
      } catch (bEx: any) {
        results.blog = { error: bEx.message };
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (globalErr: any) {
    return new Response(JSON.stringify({ error: globalErr.message, stack: globalErr.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
