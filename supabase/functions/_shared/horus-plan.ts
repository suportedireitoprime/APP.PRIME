// supabase/functions/_shared/horus-plan.ts
import { evolution } from "./evolution.ts";

export const ADMIN_EMAILS = [
  "wn7corporation@gmail.com",
  "suporte.vacatio@gmail.com",
  "wn7juridico@gmail.com",
];

export const ADMIN_PHONE_DIGITS = [
  "5511991897603",
  "11991897603",
  "991897603",
];

export interface ResolvedPlan {
  isPremium: boolean;
  plano: "pro" | "free";
  expiresAt: string | null;
  isAdmin: boolean;
  reason: string;
}

/**
 * Normaliza qualquer formato de telefone brasileiro para E.164 (55...)
 */
export function normalizePhoneE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) {
    digits = "55" + digits;
  }
  return digits;
}

/**
 * Verifica se um telefone pertence aos administradores
 */
export function isPhoneAdmin(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return false;
  return ADMIN_PHONE_DIGITS.some(
    (adm) => digits === adm || digits.endsWith(adm) || adm.endsWith(digits)
  );
}

// Cache em memória para evitar 8 queries repetitivas por mensagem do WhatsApp
const planCache = new Map<string, { plan: ResolvedPlan; expiresAt: number }>();
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Resolve o plano do usuário com cache de 5 minutos em memória.
 */
export async function resolveUserPlan(
  admin: any,
  params: { userId?: string | null; phone?: string | null; email?: string | null }
): Promise<ResolvedPlan> {
  const cacheKey = [params.phone ? normalizePhoneE164(params.phone) : "", params.userId || "", params.email || ""].filter(Boolean).join(":");
  if (cacheKey) {
    const cached = planCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.plan;
    }
  }

  const plan = await resolveUserPlanInternal(admin, params);
  if (cacheKey) {
    planCache.set(cacheKey, { plan, expiresAt: Date.now() + PLAN_CACHE_TTL_MS });
  }
  return plan;
}

/**
 * Resolução interna profunda em todas as fontes (Admin, RPC, Asaas, Play, Apple, etc.)
 */
async function resolveUserPlanInternal(
  admin: any,
  params: { userId?: string | null; phone?: string | null; email?: string | null }
): Promise<ResolvedPlan> {
  const { userId, phone, email } = params;

  // 1. Checagem por telefone de Admin
  if (phone && isPhoneAdmin(phone)) {
    return {
      isPremium: true,
      plano: "pro",
      expiresAt: "2099-12-31T23:59:59.000Z",
      isAdmin: true,
      reason: "admin_phone",
    };
  }

  // 2. Checagem por email de Admin
  if (email && ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
    return {
      isPremium: true,
      plano: "pro",
      expiresAt: "2099-12-31T23:59:59.000Z",
      isAdmin: true,
      reason: "admin_email",
    };
  }

  let effectiveUserId = userId || null;

  // Se não temos userId mas temos telefone, tenta buscar pelo profile
  if (!effectiveUserId && phone) {
    const digits = String(phone).replace(/\D/g, "");
    if (digits) {
      const variants = [digits];
      if (digits.length >= 10) variants.push(digits.slice(-11), digits.slice(-9));
      if (digits.length >= 11) variants.push("55" + digits.slice(-11));

      const { data: profiles } = await admin
        .from("profiles")
        .select("id, email, telefone, whatsapp_number, is_premium")
        .or(variants.map((v) => `telefone.ilike.%${v}%,whatsapp_number.ilike.%${v}%`).join(","))
        .limit(1);

      if (profiles && profiles.length > 0) {
        effectiveUserId = profiles[0].id;
        if (profiles[0].email && ADMIN_EMAILS.includes(profiles[0].email.toLowerCase().trim())) {
          return {
            isPremium: true,
            plano: "pro",
            expiresAt: "2099-12-31T23:59:59.000Z",
            isAdmin: true,
            reason: "admin_profile_email",
          };
        }
      }
    }
  }

  // Se ainda não temos userId, não podemos checar tabelas de assinatura
  if (!effectiveUserId) {
    return {
      isPremium: false,
      plano: "free",
      expiresAt: null,
      isAdmin: false,
      reason: "user_not_identified",
    };
  }

  // 3. Checagem se o userId é admin
  try {
    const { data: isAdminRpc } = await admin.rpc("is_admin_user", { _user_id: effectiveUserId });
    if (isAdminRpc) {
      return {
        isPremium: true,
        plano: "pro",
        expiresAt: "2099-12-31T23:59:59.000Z",
        isAdmin: true,
        reason: "is_admin_user_rpc",
      };
    }
  } catch (e) {
    console.warn("resolveUserPlan is_admin_user rpc fail", e);
  }

  // 4. Checagem via RPC is_premium_user do banco
  try {
    const { data: isPremRpc } = await admin.rpc("is_premium_user", { _user_id: effectiveUserId });
    if (isPremRpc) {
      // Busca a data de expiração mais relevante
      const exp = await getLatestExpiry(admin, effectiveUserId);
      return {
        isPremium: true,
        plano: "pro",
        expiresAt: exp,
        isAdmin: false,
        reason: "is_premium_user_rpc",
      };
    }
  } catch (e) {
    console.warn("resolveUserPlan is_premium_user rpc fail", e);
  }

  // 5. Checagem direta em Asaas Subscriptions
  try {
    const { data: asaas } = await admin
      .from("asaas_subscriptions")
      .select("status, expires_at, plano")
      .eq("user_id", effectiveUserId)
      .in("status", ["ACTIVE", "ACTIVE_GRACE"])
      .order("expires_at", { ascending: false, nullsFirst: true })
      .limit(1)
      .maybeSingle();

    if (asaas) {
      const notExpired = !asaas.expires_at || new Date(asaas.expires_at).getTime() > Date.now();
      if (notExpired) {
        return {
          isPremium: true,
          plano: "pro",
          expiresAt: asaas.expires_at || null,
          isAdmin: false,
          reason: "asaas_active",
        };
      }
    }
  } catch (e) {
    console.warn("resolveUserPlan asaas check fail", e);
  }

  // 6. Checagem direta em Play Subscriptions
  try {
    const { data: play } = await admin
      .from("play_subscriptions")
      .select("status, expires_at, product_id")
      .eq("user_id", effectiveUserId)
      .in("status", ["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"])
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (play) {
      const notExpired = !play.expires_at || new Date(play.expires_at).getTime() > Date.now();
      if (notExpired) {
        return {
          isPremium: true,
          plano: "pro",
          expiresAt: play.expires_at || null,
          isAdmin: false,
          reason: "play_active",
        };
      }
    }
  } catch (e) {
    console.warn("resolveUserPlan play check fail", e);
  }

  // 7. Checagem direta em Apple Subscriptions
  try {
    const { data: apple } = await admin
      .from("apple_subscriptions")
      .select("status, expires_at, product_id")
      .eq("user_id", effectiveUserId)
      .in("status", ["active", "in_grace"])
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (apple) {
      const notExpired = !apple.expires_at || new Date(apple.expires_at).getTime() > Date.now();
      if (notExpired) {
        return {
          isPremium: true,
          plano: "pro",
          expiresAt: apple.expires_at || null,
          isAdmin: false,
          reason: "apple_active",
        };
      }
    }
  } catch (e) {
    console.warn("resolveUserPlan apple check fail", e);
  }

  // 8. Checagem em Profiles.is_premium
  try {
    const { data: prof } = await admin
      .from("profiles")
      .select("is_premium")
      .eq("id", effectiveUserId)
      .maybeSingle();

    if (prof?.is_premium) {
      return {
        isPremium: true,
        plano: "pro",
        expiresAt: null,
        isAdmin: false,
        reason: "profile_is_premium",
      };
    }
  } catch (e) {
    console.warn("resolveUserPlan profile check fail", e);
  }

  // 9. Checagem em Legacy Subscribers
  try {
    const { data: leg } = await admin
      .from("legacy_subscribers")
      .select("status, expires_at")
      .eq("claimed_user_id", effectiveUserId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (leg) {
      const notExpired = !leg.expires_at || new Date(leg.expires_at).getTime() > Date.now();
      if (notExpired) {
        return {
          isPremium: true,
          plano: "pro",
          expiresAt: leg.expires_at || null,
          isAdmin: false,
          reason: "legacy_active",
        };
      }
    }
  } catch (e) {
    console.warn("resolveUserPlan legacy check fail", e);
  }

  return {
    isPremium: false,
    plano: "free",
    expiresAt: null,
    isAdmin: false,
    reason: "no_active_subscription",
  };
}

async function getLatestExpiry(admin: any, userId: string): Promise<string | null> {
  try {
    const [p, a, s] = await Promise.all([
      admin.from("play_subscriptions").select("expires_at").eq("user_id", userId).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("apple_subscriptions").select("expires_at").eq("user_id", userId).order("expires_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("asaas_subscriptions").select("expires_at").eq("user_id", userId).order("expires_at", { ascending: false, nullsFirst: true }).limit(1).maybeSingle(),
    ]);
    const dates = [p.data?.expires_at, a.data?.expires_at, s.data?.expires_at].filter(Boolean);
    if (!dates.length) return null;
    dates.sort((x, y) => new Date(y).getTime() - new Date(x).getTime());
    return dates[0];
  } catch {
    return null;
  }
}

/**
 * Notifica e sincroniza imediatamente o status de assinatura para o Horus.
 * Chamado por webhooks (Asaas, Google Play, Apple, validate-purchase).
 */
export async function syncHorusSubscriptionStatus(
  admin: any,
  params: {
    userId: string;
    isPremium: boolean;
    plano?: string;
    expiresAt?: string | null;
    notifyWhatsapp?: boolean;
    notifyMessage?: string;
  }
): Promise<{ ok: boolean; synced: boolean; phone?: string | null }> {
  try {
    const { userId, isPremium, expiresAt, notifyWhatsapp } = params;

    // 1. Busca perfil para encontrar o telefone / WhatsApp
    const { data: profile } = await admin
      .from("profiles")
      .select("id, display_name, telefone, whatsapp_number")
      .eq("id", userId)
      .maybeSingle();

    const rawPhone = profile?.whatsapp_number || profile?.telefone;
    const phone = normalizePhoneE164(rawPhone);
    const displayName = profile?.display_name || "Estudante";

    if (!phone) {
      console.log("syncHorusSubscriptionStatus: no phone found for user", { userId });
      return { ok: true, synced: false };
    }

    const now = new Date().toISOString();
    const planLabel = isPremium ? "pro" : "free";

    // 2. Vincula/atualiza em horus_whatsapp_users
    const { data: existingUser } = await admin
      .from("horus_whatsapp_users")
      .select("id, linked_user_id, display_name")
      .eq("phone_e164", phone)
      .maybeSingle();

    if (existingUser) {
      await admin
        .from("horus_whatsapp_users")
        .update({
          linked_user_id: userId,
          user_id: userId,
          onboarding_state: "ativo",
          display_name: existingUser.display_name || displayName,
          updated_at: now,
        })
        .eq("id", existingUser.id);
    } else {
      await admin.from("horus_whatsapp_users").insert({
        phone_e164: phone,
        user_id: userId,
        linked_user_id: userId,
        display_name: displayName,
        onboarding_state: "ativo",
        first_seen_at: now,
        last_seen_at: now,
        msg_count: 0,
      });
    }

    // 3. Atualiza/upsert em horus_user_stats
    const expText = expiresAt
      ? ` (expira em ${new Date(expiresAt).toLocaleDateString("pt-BR")})`
      : isPremium
      ? " (ativo)"
      : "";

    const contextoFormatado = `[CONTEXTO DO ALUNO]\nNome: ${displayName}\nPlano: ${planLabel}${expText}`;

    await admin.from("horus_user_stats").upsert(
      {
        telefone: phone,
        user_id: userId,
        nome_preferido: displayName.split(" ")[0],
        plano_atual: planLabel,
        plano_expira_em: isPremium ? expiresAt || null : null,
        contexto_formatado: contextoFormatado,
        updated_at: now,
      },
      { onConflict: "telefone" }
    );

    // Se o telefone sem DDI 55 existir em horus_user_stats (ex.: 11991897603), atualiza também
    const localPhone = phone.replace(/^55/, "");
    if (localPhone && localPhone !== phone) {
      await admin
        .from("horus_user_stats")
        .update({
          plano_atual: planLabel,
          plano_expira_em: isPremium ? expiresAt || null : null,
          contexto_formatado: contextoFormatado,
          updated_at: now,
        })
        .eq("telefone", localPhone)
        .catch(() => {});
    }

    console.log("syncHorusSubscriptionStatus: successfully synced", {
      userId,
      phone,
      planLabel,
    });

    // 4. Enviar mensagem de boas-vindas / aviso de plano ativado no WhatsApp (se solicitado)
    if (notifyWhatsapp && isPremium) {
      try {
        const primeiroNome = displayName.split(" ")[0];
        const defaultMsg =
          `Olá, ${primeiroNome}! 🦉✨\n\n` +
          `Seu plano *Pro* no *Vade Mecum* está ativo! Agora você tem acesso ilimitado para tirar dúvidas comigo aqui no WhatsApp, enviar áudios, imagens e PDFs.\n\n` +
          `Em que posso te ajudar hoje nos seus estudos ou trabalho? ⚖️`;

        const msgToSend = params.notifyMessage || defaultMsg;
        await evolution.sendText(phone, msgToSend);
        console.log("syncHorusSubscriptionStatus: WhatsApp notification sent", { phone });
      } catch (wErr) {
        console.warn("syncHorusSubscriptionStatus: sendText failed (non-blocking)", wErr);
      }
    }

    return { ok: true, synced: true, phone };
  } catch (err) {
    console.error("syncHorusSubscriptionStatus fatal error", err);
    return { ok: false, synced: false };
  }
}
