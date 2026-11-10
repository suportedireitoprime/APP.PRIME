import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import * as postgres from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const dbUrl = Deno.env.get('SUPABASE_DB_URL') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!dbUrl || !supabaseUrl || !serviceRoleKey) {
      throw new Error('Ambiente incompleto: SUPABASE_DB_URL, SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const pool = new postgres.Pool(dbUrl, 3, true);
    const connection = await pool.connect();

    try {
      // 1. Garante que a tabela de idempotência exista
      await connection.queryObject`
        CREATE TABLE IF NOT EXISTS public.trial_notifications_sent (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id uuid NOT NULL,
          notification_type text NOT NULL,
          sent_at timestamp with time zone DEFAULT now(),
          status text DEFAULT 'sent',
          metadata jsonb DEFAULT '{}'::jsonb,
          CONSTRAINT uq_trial_notif UNIQUE(user_id, notification_type)
        );
      `;

      // 2. Busca usuários elegíveis para o aviso de "Últimas 6 Horas"
      // Usuários criados entre 66h e 72h atrás (faltam até 6h para os 3 dias acabarem)
      // Que não tenham assinatura ativa (Asaas, Play, Apple ou profiles.is_premium)
      // e que ainda não tenham recebido este lembrete
      const sixHoursUsersRes = await connection.queryObject`
        SELECT u.id, u.email, u.created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        WHERE u.created_at >= (now() - interval '72 hours')
          AND u.created_at <= (now() - interval '66 hours')
          AND COALESCE(p.is_premium, false) = false
          AND NOT EXISTS (
            SELECT 1 FROM public.asaas_subscriptions a
            WHERE a.user_id = u.id
              AND a.status IN ('ACTIVE', 'ACTIVE_GRACE')
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.play_subscriptions ps
            WHERE ps.user_id = u.id
              AND ps.status::text IN ('SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD')
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.apple_subscriptions aps
            WHERE aps.user_id = u.id
              AND aps.status IN ('active', 'in_grace')
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.trial_notifications_sent s
            WHERE s.user_id = u.id
              AND s.notification_type = 'trial_6h_remaining'
          )
        LIMIT 100;
      `;

      const sixHoursUsers = sixHoursUsersRes.rows as Array<{ id: string; email: string; created_at: string }>;
      let sixHoursSent = 0;

      for (const u of sixHoursUsers) {
        try {
          await supabase.functions.invoke('send-push', {
            body: {
              title: '⚡ Restam 6 horas da sua degustação!',
              body: 'Seu acesso VIP de 3 dias termina hoje! Garanta o plano Vitalício por R$ 149,90 ou Anual por R$ 89,90 com até 62% OFF antes do encerramento.',
              url: '/assinatura',
              audience: { user_ids: [u.id] },
              mirror_canal: false,
              personalize: true,
              data: { automation_key: 'trial_6h_remaining' },
            },
          });

          await connection.queryObject`
            INSERT INTO public.trial_notifications_sent (user_id, notification_type, status, metadata)
            VALUES (${u.id}, 'trial_6h_remaining', 'sent', ${JSON.stringify({ email: u.email, created_at: u.created_at })})
            ON CONFLICT (user_id, notification_type) DO NOTHING;
          `;

          sixHoursSent++;
        } catch (err) {
          console.error(`Erro ao enviar lembrete de 6h para ${u.id}:`, err);
        }
      }

      // 3. Busca usuários com trial recém-expirado (entre 72h e 96h atrás)
      const expiredUsersRes = await connection.queryObject`
        SELECT u.id, u.email, u.created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        WHERE u.created_at >= (now() - interval '96 hours')
          AND u.created_at < (now() - interval '72 hours')
          AND COALESCE(p.is_premium, false) = false
          AND NOT EXISTS (
            SELECT 1 FROM public.asaas_subscriptions a
            WHERE a.user_id = u.id
              AND a.status IN ('ACTIVE', 'ACTIVE_GRACE')
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.play_subscriptions ps
            WHERE ps.user_id = u.id
              AND ps.status::text IN ('SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD')
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.apple_subscriptions aps
            WHERE aps.user_id = u.id
              AND aps.status IN ('active', 'in_grace')
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.trial_notifications_sent s
            WHERE s.user_id = u.id
              AND s.notification_type = 'trial_expired'
          )
        LIMIT 100;
      `;

      const expiredUsers = expiredUsersRes.rows as Array<{ id: string; email: string; created_at: string }>;
      let expiredSent = 0;

      for (const u of expiredUsers) {
        try {
          await supabase.functions.invoke('send-push', {
            body: {
              title: '🔒 Teste de 3 dias encerrado',
              body: 'Sua degustação gratuita acabou. Desbloqueie todo o acervo e IA sem limites a partir de R$ 29,90/mês ou R$ 149,90 vitalício!',
              url: '/assinatura',
              audience: { user_ids: [u.id] },
              mirror_canal: false,
              personalize: true,
              data: { automation_key: 'trial_expired' },
            },
          });

          await connection.queryObject`
            INSERT INTO public.trial_notifications_sent (user_id, notification_type, status, metadata)
            VALUES (${u.id}, 'trial_expired', 'sent', ${JSON.stringify({ email: u.email, created_at: u.created_at })})
            ON CONFLICT (user_id, notification_type) DO NOTHING;
          `;

          expiredSent++;
        } catch (err) {
          console.error(`Erro ao enviar aviso de expiração para ${u.id}:`, err);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        sixHoursChecked: sixHoursUsers.length,
        sixHoursSent,
        expiredChecked: expiredUsers.length,
        expiredSent,
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } finally {
      connection.release();
      await pool.end();
    }

  } catch (error: any) {
    console.error('Erro em trial-reminders-tick:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
