import { createClient } from "npm:@supabase/supabase-js@2";
import { evolution } from "../_shared/evolution.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_PHONE_DEFAULT = "+5511991897603";

export const handler = async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const adminDb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "").trim();
    const ADMIN_PHONE = Deno.env.get("ADMIN_PHONE") || ADMIN_PHONE_DEFAULT;
    const agora = new Date();

    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(agora);

    // --- AÇÃO 1: Notificação de Novo Cadastro ---
    if (action === "notify_signup") {
      const userId = body.user_id;
      const userEmail = body.email;

      if (!userId && !userEmail) {
        return new Response(JSON.stringify({ error: "user_id ou email é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Deduplicação: verifica se já notificamos este cadastro nas últimas 24h
      if (userId) {
        const { data: alreadyNotified } = await adminDb
          .from("app_events")
          .select("id")
          .eq("event_name", "admin_notified_signup")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (alreadyNotified) {
          return new Response(JSON.stringify({ ok: true, skipped: "already_notified" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Busca dados completos no perfil
      let profile: any = null;
      if (userId) {
        const { data } = await adminDb
          .from("profiles")
          .select("display_name, email, telefone, whatsapp_number, created_at")
          .eq("id", userId)
          .maybeSingle();
        profile = data;
      } else if (userEmail) {
        const { data } = await adminDb
          .from("profiles")
          .select("id, display_name, email, telefone, whatsapp_number, created_at")
          .ilike("email", userEmail.trim())
          .maybeSingle();
        profile = data;
      }

      const finalUserId = userId || profile?.id || null;
      const finalEmail = profile?.email || userEmail || "Não informado";
      const finalNome = profile?.display_name || body.name || finalEmail.split("@")[0] || "Usuário";
      const providerRaw = String(body.method || body.provider || "E-mail").toLowerCase();
      const providerLabel = providerRaw.includes("google") ? "Google" : providerRaw.includes("apple") ? "Apple" : "E-mail";
      const telefone = profile?.whatsapp_number || profile?.telefone || body.phone || "Não informado";

      // Calcula o total de cadastros de hoje (horário de Brasília)
      const hojeIsoDate = agora.toISOString().split("T")[0];
      const { count: totalHoje } = await adminDb
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .gte("created_at", `${hojeIsoDate}T00:00:00.000Z`);

      const countFormatado = (totalHoje && totalHoje > 0) ? totalHoje : 1;

      const msg = [
        "🆕 *NOVO CADASTRO NO DIREITO PRIME* 🦉",
        "",
        `👤 *Nome:* ${finalNome}`,
        `✉️ *E-mail:* ${finalEmail}`,
        `🔐 *Origem:* ${providerLabel}`,
        `📱 *Telefone:* ${telefone}`,
        `🕐 *Horário:* ${dataFormatada}`,
        "",
        `📊 *Total de cadastros hoje:* ${countFormatado} usuário${countFormatado === 1 ? "" : "s"}`
      ].join("\n");

      await evolution.sendText(ADMIN_PHONE, msg);

      // Registra evento para deduplicação
      await adminDb.from("app_events").insert({
        user_id: finalUserId,
        email: finalEmail !== "Não informado" ? finalEmail : null,
        event_name: "admin_notified_signup",
        metadata: {
          provider: providerLabel,
          phone: telefone,
          sent_at: agora.toISOString()
        }
      });

      return new Response(JSON.stringify({ ok: true, sent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- AÇÃO 2: Notificação de Nova Assinatura ---
    if (action === "notify_subscription") {
      const paymentId = body.payment_id;
      if (paymentId) {
        const { data: alreadySent } = await adminDb
          .from("app_events")
          .select("id")
          .eq("event_name", "admin_notified_subscription")
          .contains("metadata", { payment_id: paymentId })
          .limit(1)
          .maybeSingle();

        if (alreadySent) {
          return new Response(JSON.stringify({ ok: true, skipped: "already_notified" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const clienteNome = body.name || body.cliente || (body.email ? body.email.split("@")[0] : "Assinante");
      const userEmail = body.email || "Não informado";
      const plano = body.plano || "Vitalício";
      const valor = body.valor ? (String(body.valor).startsWith("R$") ? body.valor : `R$ ${Number(body.valor).toFixed(2).replace(".", ",")}`) : "";
      const metodo = body.metodo || "PIX";

      const msg = [
        "🔔 *NOVA ASSINATURA CONFIRMADA!* 💰🦉",
        "",
        `👤 *Cliente:* ${clienteNome}`,
        `📧 *E-mail:* ${userEmail}`,
        `💎 *Plano:* ${plano}`,
        ...(valor ? [`💵 *Valor:* ${valor}`] : []),
        `⚡ *Método:* ${metodo}`,
        `🕐 *Horário:* ${dataFormatada}`,
        "",
        "Acesso liberado instantaneamente com sucesso!"
      ].join("\n");

      await evolution.sendText(ADMIN_PHONE, msg);

      await adminDb.from("app_events").insert({
        user_id: body.user_id || null,
        email: userEmail !== "Não informado" ? userEmail : null,
        event_name: "admin_notified_subscription",
        metadata: {
          payment_id: paymentId || null,
          plano,
          valor,
          metodo,
          sent_at: agora.toISOString()
        }
      });

      return new Response(JSON.stringify({ ok: true, sent: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("notify-admin error:", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};
